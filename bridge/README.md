# Chekt Bridge

SMTP와 HTTP 서버를 통해 알람을 수신하고 server로 이벤트를 전송하는 bridge 서비스입니다.

## 기능

- SMTP 서버 (포트 1025)에서 이메일 수신
- HTTP 서버 (포트 8080)에서 HTTP 요청 수신
- WebSocket 클라이언트를 통한 실시간 서버 통신
- Protocol Buffers를 사용한 효율적인 메시지 직렬화
- 다양한 카메라 제조사별 이메일 파싱 (Dahua, Hikvision 등)
- HTTP 알람 요청 파싱
- 이메일/HTTP 내용 파싱하여 알람 이벤트 추출
- 추출된 이벤트를 server로 HTTP POST 및 WebSocket 전송
- 확장 가능한 파서 아키텍처 (SMTP, HTTP, WebSocket 프로토콜 지원)
- 자동 재연결 및 하트비트 기능

## 환경 변수

Bridge 서비스는 `.env` 파일을 통해 환경 변수를 설정할 수 있습니다.

### 지원되는 환경 변수

- `SERVER_URL`: server의 URL (기본값: http://localhost:8080)
- `WEBSOCKET_URL`: WebSocket 서버 URL (기본값: ws://localhost:8080)
- `SMTP_PORT`: SMTP 서버 포트 (기본값: 1025)
- `HTTP_PORT`: HTTP 서버 포트 (기본값: 8081)
- `SITE_ID`: 사이트 ID (기본값: "1")
- `CAMERA_PATH`: 카메라 설정 파일 경로 (기본값: camera.csv)
- `DEBUG`: 디버그 모드 활성화 (true/false)

### .env 파일 설정

프로젝트 루트에 `.env` 파일을 생성하고 다음과 같이 설정하세요:

```bash
# .env 파일 예시
SERVER_URL=http://localhost:8080
WEBSOCKET_URL=ws://localhost:8080
SMTP_PORT=1025
HTTP_PORT=8081
SITE_ID=1
CAMERA_PATH=cameras.csv
DEBUG=false
```

## 실행

```bash
# 로컬 실행
go run main.go

# Docker 실행
docker build -t chekt-bridge .
docker run -p 1025:1025 -p 8080:8080 -e SERVER_URL=http://localhost:3000 chekt-bridge
```

## API

### HTTP 알람 엔드포인트

Bridge는 `/alarm` 엔드포인트로 HTTP POST 요청을 받아 알람 이벤트를 처리합니다.

```bash
curl -X POST http://localhost:8081/alarm \
  -H "Content-Type: application/json" \
  -d '{
    "eventType": "motion_detection",
    "deviceName": "camera1",
    "ipAddress": "192.168.1.100",
    "alarmName": "motion",
    "startTime": "2024-01-01T12:00:00Z"
  }'
```

### 이벤트 전송

Bridge는 server의 `/api/events` 엔드포인트로 POST 요청을 보냅니다.

요청 본문:

```json
{
  "type": "alarm",
  "timestamp": "2024-01-01T12:00:00Z",
  "data": {
    "eventType": "alarm",
    "deviceName": "device1",
    "ipAddress": "192.168.1.100",
    "inputChannel": "ch1",
    "alarmName": "motion",
    "startTime": "2024-01-01T12:00:00Z",
    "rawContent": "email content",
    "receivedAt": "2024-01-01T12:00:00Z"
  }
}
```

### WebSocket 통신

Bridge는 WebSocket을 통해 서버와 실시간 통신합니다.

#### 통신 방향

- **서버 → 클라이언트**: Command (명령)
- **클라이언트 → 서버**: Event (이벤트)

#### 연결

- WebSocket URL: `WEBSOCKET_URL` 환경 변수로 설정
- 자동 재연결 기능
- 30초마다 하트비트 전송
- 60초마다 헬스체크 이벤트 전송 (HealthCheck Manager)

### HealthCheck Manager

Bridge는 헬스체크 기능을 별도의 Manager로 관리합니다.

#### 기능

- **자동 헬스체크**: 설정된 간격으로 자동 헬스체크 이벤트 전송
- **상태 관리**: Bridge 상태 (HEALTHY, WARNING, ERROR, OFFLINE) 관리
- **업타임 추적**: Bridge 서비스 실행 시간 추적
- **커스텀 상태**: 필요시 다른 상태로 헬스체크 전송 가능

#### 사용법

```go
// HealthCheck Manager 생성
healthManager := healthcheck.NewManager(logger, "site_1", 60*time.Second)

// 헬스체크 시작
healthManager.Start(wsClient.SendEvent)

// 헬스체크 이벤트 생성
event := healthManager.CreateHealthCheckEvent()

// 커스텀 상태로 헬스체크 생성
warningEvent := healthManager.CreateHealthCheckEventWithStatus(
    protobuf.BridgeStatus_BRIDGE_STATUS_WARNING,
)

// 업타임 조회
uptime := healthManager.GetUptime()

// Manager 정지
healthManager.Stop()
```

#### 메시지 타입

**클라이언트 → 서버: Protocol Buffers 이벤트 (Binary Message)**

```go
// 헬스체크 이벤트 예시
event := &protobuf.Event{
    Id:        "event_123",
    Timestamp: time.Now().Unix(),
    Payload: &protobuf.Event_HealthCheck{
        HealthCheck: &protobuf.HealthCheck{
            BridgeId:      "site_1",
            Status:        protobuf.BridgeStatus_BRIDGE_STATUS_HEALTHY,
            UptimeSeconds: 3600,
        },
    },
}
```

**서버 → 클라이언트: Protocol Buffers 명령 (Binary Message)**

```go
// 서버에서 보내는 명령 예시
command := &protobuf.Command{
    Id: "camera_start_recording",
}
```

**JSON 메시지 (Text Message)**

```json
{
  "type": "greeting",
  "data": {
    "message": "Hello from bridge",
    "timestamp": 1640995200
  }
}
```

#### 메시지 핸들러 등록

```go
// 서버에서 받는 명령 핸들러 등록
client.RegisterHandler("command", func(data []byte) error {
    log.Log(logger.Info, "Received command from server")

    // Parse command data
    var command protobuf.Command
    if err := json.Unmarshal(data, &command); err != nil {
        return err
    }

    // Handle different command types
    switch command.Id {
    case "camera_start_recording":
        log.Log(logger.Info, "Received camera start recording command")
    case "camera_stop_recording":
        log.Log(logger.Info, "Received camera stop recording command")
    case "health_check_request":
        log.Log(logger.Info, "Received health check request")
    default:
        log.Log(logger.Warn, "Unknown command ID: %s", command.Id)
    }

    return nil
})
```

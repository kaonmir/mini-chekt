# Recorder Package

이 패키지는 RTSP 스트림을 받아서 메모리에 패킷 단위로 저장하는 기능을 제공합니다.

## 주요 기능

- **RTSP 스트림 연결**: 카메라의 RTSP 스트림에 연결하여 실시간 비디오 데이터를 수신
- **메모리 기반 저장**: 파일 시스템 대신 메모리에 패킷 단위로 저장
- **140초 제한**: 최대 140초의 패킷만 저장하고, 초과 시 가장 오래된 것부터 자동 삭제
- **멀티 카메라 지원**: 여러 카메라의 동시 녹화 지원
- **데이터베이스 연동**: Supabase에서 카메라 정보를 자동으로 가져와서 설정

## 구조

### Packet

```go
type Packet struct {
    Data      []byte    // 비디오 데이터
    Timestamp time.Time // 타임스탬프
}
```

### CameraRecorder

개별 카메라의 녹화를 관리하는 구조체입니다.

### Recorder

여러 카메라의 녹화를 관리하는 메인 구조체입니다.

## 사용법

### 기본 사용법

```go
package main

import (
    "github.com/kaonmir/bridge/internal/config"
    "github.com/kaonmir/bridge/internal/logger"
    "github.com/kaonmir/bridge/internal/manager/recorder"
    "github.com/kaonmir/bridge/internal/supabase"
)

func main() {
    // Logger 초기화
    log := logger.New()

    // Config 초기화
    cfg := &config.Config{
        BridgeUUID: "your-bridge-uuid",
        SupabaseURL: "your-supabase-url",
        SupabaseKey: "your-supabase-key",
    }

    // Supabase 클라이언트 초기화
    supabaseClient, err := supabase.NewSupabaseClient(cfg)
    if err != nil {
        log.Log(logger.Error, "Failed to create Supabase client: %v", err)
        return
    }

    // Recorder 생성
    recorder := recorder.NewRecorder(log, supabaseClient)

    // 특정 브리지의 카메라들 로드 및 녹화 시작
    bridgeID := "1"
    err = recorder.LoadCameras(bridgeID)
    if err != nil {
        log.Log(logger.Error, "Failed to load cameras: %v", err)
        return
    }

    // 녹화된 패킷 조회
    recorders := recorder.GetAllRecorders()
    for cameraID, cameraRecorder := range recorders {
        packetCount := cameraRecorder.GetPacketCount()
        log.Log(logger.Info, "Camera %s has %d packets", cameraID, packetCount)

        // 최근 10개 패킷 조회
        latestPackets := cameraRecorder.GetLatestPackets(10)
        log.Log(logger.Info, "Latest %d packets for camera %s", len(latestPackets), cameraID)
    }

    // 모든 녹화 중지
    recorder.StopAll()
}
```

### 특정 카메라의 패킷 조회

```go
// 특정 카메라의 녹화기 가져오기
cameraRecorder, exists := recorder.GetRecorder("camera-id")
if !exists {
    log.Log(logger.Error, "Camera not found")
    return
}

// 패킷 개수 조회
count := cameraRecorder.GetPacketCount()
log.Log(logger.Info, "Packet count: %d", count)

// 최근 패킷들 조회
latest := cameraRecorder.GetLatestPackets(5)
for i, packet := range latest {
    log.Log(logger.Info, "Packet %d: %d bytes at %s",
        i+1, len(packet.Data), packet.Timestamp.Format(time.RFC3339))
}

// 특정 시간 이후의 패킷들 조회
since := time.Now().Add(-60 * time.Second) // 1분 전부터
recent := cameraRecorder.GetPackets(since)
log.Log(logger.Info, "Packets from last minute: %d", len(recent))
```

## RTSP URL 형식

카메라의 RTSP URL은 다음과 같은 형식으로 자동 생성됩니다:

```
rtsp://<username>:<password>@<ip_address>:554/cam/realmonitor?channel=1&subtype=0
```

## 메모리 관리

- 각 카메라는 최대 140초의 패킷을 메모리에 저장합니다
- 140초를 초과하는 패킷은 자동으로 삭제됩니다
- 패킷은 타임스탬프 기반으로 관리됩니다

## 데이터베이스 연동

recorder는 Supabase 데이터베이스에서 다음 정보를 자동으로 가져옵니다:

- 카메라 ID
- 카메라 이름
- IP 주소
- 사용자명
- 비밀번호
- 브리지 ID
- 등록 상태
- 상태 정보

## 주의사항

1. **메모리 사용량**: 각 카메라마다 140초의 비디오 데이터가 메모리에 저장되므로, 카메라 수가 많을 경우 메모리 사용량을 모니터링해야 합니다.

2. **RTSP 연결**: 현재 구현에서는 시뮬레이션 모드로 동작합니다. 실제 RTSP 클라이언트 라이브러리를 사용하려면 `recordStream` 메서드를 수정해야 합니다.

3. **에러 처리**: RTSP 연결 실패나 데이터베이스 오류에 대한 적절한 에러 처리가 필요합니다.

4. **동시성**: 여러 고루틴에서 동시에 접근할 수 있도록 뮤텍스를 사용하여 스레드 안전성을 보장합니다.

## 향후 개선 사항

- 실제 RTSP 클라이언트 라이브러리 통합
- 패킷 압축 및 최적화
- 디스크 기반 백업 옵션
- 실시간 스트리밍 기능
- 알람 이벤트와 연동된 녹화 기능

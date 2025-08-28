-- Mock data for site table
INSERT INTO site (site_name, contact_name, contact_phone, logo_url, arm_status, arm_status_changed_at) VALUES
('Seoul Central Office', 'Kim Min-su', '+82-2-1234-5678', null, 'arm', '2024-01-15 09:00:00+09'),
('Busan Harbor Facility', 'Park Ji-hyun', '+82-51-9876-5432', null, 'disarm', '2024-01-14 18:30:00+09'),
('Incheon Airport Terminal', 'Lee Dong-wook', '+82-32-5555-1234', null, 'arm', '2024-01-15 06:00:00+09'),
('Daegu Manufacturing Plant', 'Choi Soo-jin', '+82-53-7777-8888', null, 'arm', '2024-01-15 08:15:00+09'),
('Daejeon Research Center', 'Jung Hae-won', '+82-42-3333-4444', null, 'disarm', '2024-01-14 22:00:00+09');

-- Mock data for bridge table
INSERT INTO bridge (bridge_uuid, site_id, bridge_name, healthy, last_checked_at) VALUES
('550e8400-e29b-41d4-a716-446655440001', 1, 'Main Gateway Bridge', true, '2024-01-15 10:30:00+09'),
('550e8400-e29b-41d4-a716-446655440002', 1, 'Backup Bridge', true, '2024-01-15 10:30:00+09'),
('550e8400-e29b-41d4-a716-446655440003', 2, 'Harbor Bridge 1', true, '2024-01-15 09:45:00+09'),
('550e8400-e29b-41d4-a716-446655440004', 2, 'Harbor Bridge 2', false, '2024-01-15 09:45:00+09'),
('550e8400-e29b-41d4-a716-446655440005', 3, 'Terminal Bridge A', true, '2024-01-15 07:20:00+09'),
('550e8400-e29b-41d4-a716-446655440006', 3, 'Terminal Bridge B', true, '2024-01-15 07:20:00+09'),
('550e8400-e29b-41d4-a716-446655440007', 4, 'Factory Bridge North', true, '2024-01-15 09:00:00+09'),
('550e8400-e29b-41d4-a716-446655440008', 4, 'Factory Bridge South', true, '2024-01-15 09:00:00+09'),
('550e8400-e29b-41d4-a716-446655440009', 5, 'Research Bridge Alpha', true, '2024-01-15 08:30:00+09'),
('550e8400-e29b-41d4-a716-446655440010', 5, 'Research Bridge Beta', false, '2024-01-15 08:30:00+09');
-- Mock data for camera table
INSERT INTO camera (bridge_id, camera_name, ip_address, source, is_registered, healthy, last_checked_at) VALUES
(1, 'Main Entrance Cam 1', '192.168.1.101', 'rtsp://192.168.1.101/stream1', true, true, '2024-01-15 10:30:00+09'),
(1, 'Main Entrance Cam 2', '192.168.1.102', 'rtsp://192.168.1.102/stream1', false, true, '2024-01-15 10:30:00+09'),
(2, 'Backup Entrance Cam', '192.168.1.201', 'rtsp://192.168.1.201/stream1', true, true, '2024-01-15 10:30:00+09'),
(3, 'Harbor Dock Cam 1', '192.168.2.101', 'rtsp://192.168.2.101/stream1', false, true, '2024-01-15 09:45:00+09'),
(3, 'Harbor Dock Cam 2', '192.168.2.102', 'rtsp://192.168.2.102/stream1', true, true, '2024-01-15 09:45:00+09'),
(4, 'Harbor Storage Cam', '192.168.2.201', 'rtsp://192.168.2.201/stream1', true, false, '2024-01-15 09:45:00+09'),
(5, 'Terminal Check-in Cam', '192.168.3.101', 'rtsp://192.168.3.101/stream1', false, true, '2024-01-15 07:20:00+09'),
(5, 'Terminal Security Cam', '192.168.3.102', 'rtsp://192.168.3.102/stream1', true, true, '2024-01-15 07:20:00+09'),
(6, 'Terminal Gate Cam', '192.168.3.201', 'rtsp://192.168.3.201/stream1', true, true, '2024-01-15 07:20:00+09'),
(7, 'Factory Floor Cam 1', '192.168.4.101', 'rtsp://192.168.4.101/stream1', false, true, '2024-01-15 09:00:00+09'),
(7, 'Factory Floor Cam 2', '192.168.4.102', 'rtsp://192.168.4.102/stream1', true, true, '2024-01-15 09:00:00+09'),
(8, 'Factory Warehouse Cam', '192.168.4.201', 'rtsp://192.168.4.201/stream1', false, true, '2024-01-15 09:00:00+09'),
(9, 'Research Lab Cam 1', '192.168.5.101', 'rtsp://192.168.5.101/stream1', true, true, '2024-01-15 08:30:00+09'),
(9, 'Research Lab Cam 2', '192.168.5.102', 'rtsp://192.168.5.102/stream1', false, true, '2024-01-15 08:30:00+09'),
(10, 'Research Server Cam', '192.168.5.201', 'rtsp://192.168.5.201/stream1', true, false, '2024-01-15 08:30:00+09');

-- Mock data for alarm table
INSERT INTO alarm (site_id, bridge_id, camera_id, alarm_name, alarm_type, last_alarm_at, is_read, read_at, snapshot_urls) VALUES
(2, 4, 6, 'Camera Connection Lost', 'connection_error', '2024-01-15 09:45:00+09', false, NULL, ARRAY['https://picsum.photos/200/300', 'https://picsum.photos/200/300', 'https://picsum.photos/200/300', 'https://picsum.photos/200/300', 'https://picsum.photos/200/300', 'https://picsum.photos/200/300', 'https://picsum.photos/200/300', 'https://picsum.photos/200/300']),
(5, 10, 15, 'Server Room Access Detected', 'unauthorized_access', '2024-01-15 08:30:00+09', true, '2024-01-15 08:35:00+09', ARRAY['https://picsum.photos/200/300', 'https://picsum.photos/200/300', 'https://picsum.photos/200/300', 'https://picsum.photos/200/300', 'https://picsum.photos/200/300', 'https://picsum.photos/200/300', 'https://picsum.photos/200/300', 'https://picsum.photos/200/300']),
(1, 1, 1, 'Motion Detected at Main Entrance', 'motion_detection', '2024-01-15 10:30:00+09', false, NULL, ARRAY['https://picsum.photos/200/300', 'https://picsum.photos/200/300', 'https://picsum.photos/200/300', 'https://picsum.photos/200/300', 'https://picsum.photos/200/300', 'https://picsum.photos/200/300', 'https://picsum.photos/200/300', 'https://picsum.photos/200/300']),
(3, 5, 7, 'Security Checkpoint Alert', 'security_alert', '2024-01-15 07:20:00+09', true, '2024-01-15 07:25:00+09', ARRAY['https://picsum.photos/200/300', 'https://picsum.photos/200/300', 'https://picsum.photos/200/300', 'https://picsum.photos/200/300', 'https://picsum.photos/200/300', 'https://picsum.photos/200/300', 'https://picsum.photos/200/300', 'https://picsum.photos/200/300']),
(4, 7, 10, 'Factory Equipment Malfunction', 'equipment_error', '2024-01-15 09:00:00+09', false, NULL, ARRAY['https://picsum.photos/200/300', 'https://picsum.photos/200/300', 'https://picsum.photos/200/300', 'https://picsum.photos/200/300', 'https://picsum.photos/200/300', 'https://picsum.photos/200/300', 'https://picsum.photos/200/300', 'https://picsum.photos/200/300']),
(2, 3, 4, 'Harbor Dock Activity', 'motion_detection', '2024-01-15 09:45:00+09', false, NULL, ARRAY['https://picsum.photos/200/300', 'https://picsum.photos/200/300', 'https://picsum.photos/200/300', 'https://picsum.photos/200/300', 'https://picsum.photos/200/300', 'https://picsum.photos/200/300', 'https://picsum.photos/200/300', 'https://picsum.photos/200/300']),
(1, 2, 3, 'Backup System Activated', 'system_alert', '2024-01-15 10:30:00+09', true, '2024-01-15 10:32:00+09', ARRAY['https://picsum.photos/200/300', 'https://picsum.photos/200/300', 'https://picsum.photos/200/300', 'https://picsum.photos/200/300', 'https://picsum.photos/200/300', 'https://picsum.photos/200/300', 'https://picsum.photos/200/300', 'https://picsum.photos/200/300']),
(3, 6, 9, 'Terminal Gate Opened', 'access_control', '2024-01-15 07:20:00+09', false, NULL, ARRAY['https://picsum.photos/200/300', 'https://picsum.photos/200/300', 'https://picsum.photos/200/300', 'https://picsum.photos/200/300', 'https://picsum.photos/200/300', 'https://picsum.photos/200/300', 'https://picsum.photos/200/300', 'https://picsum.photos/200/300']),
(5, 9, 13, 'Research Lab Door Opened', 'access_control', '2024-01-15 08:30:00+09', true, '2024-01-15 08:33:00+09', ARRAY['https://picsum.photos/200/300', 'https://picsum.photos/200/300', 'https://picsum.photos/200/300', 'https://picsum.photos/200/300', 'https://picsum.photos/200/300', 'https://picsum.photos/200/300', 'https://picsum.photos/200/300', 'https://picsum.photos/200/300']),
(4, 8, 12, 'Warehouse Inventory Check', 'scheduled_event', '2024-01-15 09:00:00+09', false, NULL, ARRAY['https://picsum.photos/200/300', 'https://picsum.photos/200/300', 'https://picsum.photos/200/300', 'https://picsum.photos/200/300', 'https://picsum.photos/200/300', 'https://picsum.photos/200/300', 'https://picsum.photos/200/300', 'https://picsum.photos/200/300']);

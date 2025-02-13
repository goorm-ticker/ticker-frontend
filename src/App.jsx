import React, { useEffect, useRef } from "react";
import loadKakaoMap from "./components/KakaoLoader"; // Kakao Maps 로더
import useSSE from "./components/SseHandler"; // SSE 요청 Hook
import './App.css';

// 지도에 표시할 초기 데이터 (하드코딩)
const TEST_DATA = [
  {
    id: 1,
    name: "구의야구공원",
    position: { lat: 37.54699, lng: 127.09598 },
    waiting: 5,
    expectedTime: "15:00 이후",
    url: "https://map.kakao.com/link/map/11394059"
  },
  {
    id: 2,
    name: "성수동 야구장",
    position: { lat: 37.54122, lng: 127.04655 },
    waiting: 10,
    expectedTime: "16:00 이후",
    url: "https://map.kakao.com/link/map/11394060"
  },
];

function App() {
  const mapRef = useRef(null); // Kakao 지도 객체를 저장할 ref
  const overlaysRef = useRef({}); // 마커와 오버레이를 저장할 ref

  // ** Kakao 지도 초기화 및 TEST_DATA로 마커 렌더링 **
  useEffect(() => {
    loadKakaoMap()
      .then(() => {
        const { kakao } = window;

        if (!kakao || !kakao.maps) {
          console.error("❌ Kakao Maps API가 정상적으로 로드되지 않았습니다.");
          return;
        }

        // 지도 생성
        const mapContainer = document.getElementById("map");
        const mapOption = {
          center: new kakao.maps.LatLng(37.54699, 127.09598),
          level: 4
        };
        const map = new kakao.maps.Map(mapContainer, mapOption);
        mapRef.current = map; // 지도 객체 저장

        // 마커 추가 함수
        const addStoreMarker = (store) => {
          const markerPosition = new kakao.maps.LatLng(
            store.position.lat,
            store.position.lng
          );
          const marker = new kakao.maps.Marker({
            position: markerPosition
          });
          marker.setMap(map); // 지도에 마커 추가

          const content = `
            <div class="customoverlay">
              <a href="${store.url}" target="_blank">
                <span class="title">${store.name}</span>
                <div class="info">
                  <div class="waiting">현재 대기 인원: ${store.waiting}명</div>
                  <div class="time">입장 예상 시각: ${store.expectedTime}</div>
                </div>
              </a>
            </div>
          `;

          const customOverlay = new kakao.maps.CustomOverlay({
            position: markerPosition,
            content: content,
            yAnchor: 1
          });
          customOverlay.setMap(map); // 지도에 오버레이 추가

          // 마커와 오버레이 저장
          overlaysRef.current[store.id] = { marker, customOverlay };
        };

        // TEST_DATA로 초기 마커 렌더링
        TEST_DATA.forEach((store) => {
          addStoreMarker(store);
        });
      })
      .catch((error) => {
        console.error("Error loading Kakao Maps:", error);
      });
  }, []);

  // ** SSE 요청 및 실시간 업데이트 처리 **
  useSSE((updatedStore) => {
    const { id, name, waiting, expectedTime, url, position } = updatedStore;

    if (overlaysRef.current[id]) {
      // 기존 오버레이 업데이트
      const { customOverlay } = overlaysRef.current[id];

      const newContent = `
        <div class="customoverlay">
          <a href="${url}" target="_blank">
            <span class="title">${name}</span>
            <div class="info">
              <div class="waiting">현재 대기 인원: ${waiting}명</div>
              <div class="time">입장 예상 시각: ${expectedTime}</div>
            </div>
          </a>
        </div>
      `;
      customOverlay.setContent(newContent); // 오버레이 내용 업데이트
    } else if (position) {
      // 새로운 마커 추가
      const { kakao } = window;
      const markerPosition = new kakao.maps.LatLng(position.lat, position.lng);
      const marker = new kakao.maps.Marker({ position: markerPosition });
      marker.setMap(mapRef.current);

      const content = `
        <div class="customoverlay">
          <a href="${url}" target="_blank">
            <span class="title">${name}</span>
            <div class="info">
              <div class="waiting">현재 대기 인원: ${waiting}명</div>
              <div class="time">입장 예상 시각: ${expectedTime}</div>
            </div>
          </a>
        </div>
      `;
      const customOverlay = new kakao.maps.CustomOverlay({
        position: markerPosition,
        content: content,
        yAnchor: 1
      });
      customOverlay.setMap(mapRef.current);

      overlaysRef.current[id] = { marker, customOverlay }; // 저장
    }
  });

  return <div id="map" style={{ width: "100%", height: "100vh" }} />;
}

export default App;

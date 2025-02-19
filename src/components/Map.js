import React, { useEffect, useState, useRef } from 'react';

const MapComponent = () => {
  const [map, setMap] = useState(null);
  const [searchKeyword, setSearchKeyword] = useState('');
  const [markers, setMarkers] = useState([]);
  const [places, setPlaces] = useState([]);
  const [userId, setUserId] = useState('');
  const eventSourceRef = useRef(null);
  const sseMarkersRef = useRef(new Map());
  const sseOverlaysRef = useRef(new Map());

  useEffect(() => {
    const script = document.createElement('script');
    script.src = `https://dapi.kakao.com/v2/maps/sdk.js?appkey=2aec7833541a78e29205ed35ce2d1a53&autoload=false&libraries=services`;
    script.async = true;
    //초기 지도 그리기
    script.onload = () => {
      window.kakao.maps.load(() => {
        const container = document.getElementById('map');
        const defaultPosition = new window.kakao.maps.LatLng(37.5665, 126.9780);
        const options = { center: defaultPosition, level: 3 };

        const kakaoMap = new window.kakao.maps.Map(container, options);
        setMap(kakaoMap);
        //사용자의 현재 위치를 가져올 수 있다면 지도 시작 지점을 사용자의 현재 위치로 지정 (디폴트는 서울 시청)
        if (navigator.geolocation) {
          navigator.geolocation.getCurrentPosition(
            (position) => {
              const lat = position.coords.latitude;
              const lng = position.coords.longitude;
              const userLocation = new window.kakao.maps.LatLng(lat, lng);
              kakaoMap.setCenter(userLocation);

              new window.kakao.maps.Marker({ position: userLocation, map: kakaoMap });
            },
            (error) => {
              console.error('위치 정보를 가져올 수 없습니다.', error);
            }
          );
        }
      });
    };
    document.head.appendChild(script);
  }, []);

  //서버에 SSE 연결 해제 요청 전송
  const disconnectSSE = async () => {
    if (eventSourceRef.current) {
      console.log('🔌 SSE 연결 종료 시도 중...');
      try {
        await fetch(`http://localhost:8080/maps/disconnect/${userId}`, { method: 'POST' });
        if (eventSourceRef.current) {
          eventSourceRef.current.close();
          eventSourceRef.current = null;
          console.log('✅ SSE 연결이 안전하게 종료되었습니다.');
        }
      } catch (error) {
        console.error('❌ SSE 종료 요청 실패:', error);
      }
    } else {
      console.log('⚠️ SSE 연결이 존재하지 않습니다.');
    }
  
    if (sseMarkersRef.current.size > 0) {
      sseMarkersRef.current.forEach(marker => marker.setMap(null));
      sseMarkersRef.current.clear();
      console.log('📌 기존 마커가 제거되었습니다.');
    }
  
    if (sseOverlaysRef.current.size > 0) {
      sseOverlaysRef.current.forEach(overlay => overlay.setMap(null));
      sseOverlaysRef.current.clear();
      console.log('🗺 기존 오버레이가 제거되었습니다.');
    }
  };

  //검색 로직
  const handleSearch = () => {
    if (!searchKeyword.trim()) {
      alert('검색어를 입력하세요!');
      return;
    }

    if (eventSourceRef.current) {
      fetch(`http://localhost:8080/maps/disconnect/${userId}`, { method: 'POST' })
          .then(() => {
            eventSourceRef.current.close();
            eventSourceRef.current = null;
            console.log('SSE 연결 종료 요청 및 클라이언트 연결 종료됨');
          })
          .catch(error => console.error('SSE 종료 요청 실패:', error));
    }

    markers.forEach(({ marker }) => marker.setMap(null));
    setMarkers([]);

    sseMarkersRef.current.forEach(marker => marker.setMap(null));
    sseMarkersRef.current.clear();

    sseOverlaysRef.current.forEach(overlay => overlay.setMap(null));
    sseOverlaysRef.current.clear();

    const ps = new window.kakao.maps.services.Places();
    ps.keywordSearch(searchKeyword, (data, status) => {
      if (status === window.kakao.maps.services.Status.OK) {
        const filteredData = data.filter(place => place.category_group_code === "FD6");

        if (filteredData.length === 0) {
          alert("음식점 검색 결과가 없습니다.");
          return;
        }

        setPlaces(filteredData);
        const bounds = new window.kakao.maps.LatLngBounds();
        const newMarkers = filteredData.map(place => {
          const position = new window.kakao.maps.LatLng(place.y, place.x);
          const marker = new window.kakao.maps.Marker({ map: map, position: position });

          window.kakao.maps.event.addListener(marker, 'click', () => {
            if (!userId.trim()) {
              alert('유저 ID를 입력하세요.');
              return;
            }
            disconnectSSE().then(() => {
              console.log("🔗 기존 SSE 연결 종료 후 새로운 SSE 연결 시작...");
              connectToSSE(userId, [place]);
            });
          });

          if (filteredData.length <= 10) {
            let overlayContent = `
              <div class="customoverlay">
                <a href="${place.place_url}" target="_blank"> 
                  <span class="title">${place.place_name}</strong><br/>대기 인원: ${place.waiting}</span>
                </a>
              </div>`;

            if (place.myWaiting !== undefined && place.myWaiting !== -1) {
              overlayContent += `<br/>나의 대기 순위: ${place.myWaiting}`;
            }
            if (place.waitingTime !== undefined && place.waitingTime !== -1) {
              overlayContent += `<br/>나의 예상 대기 시간: ${place.waitingTime}`;
            }

            const customOverlay = new window.kakao.maps.CustomOverlay({
              position: position,
              yAnchor: 0,
              content: overlayContent
            });
            customOverlay.setMap(map);
            sseOverlaysRef.current.set(place.id, customOverlay);
          }
          bounds.extend(position);
          return { marker, id: place.id };
        });

        setMarkers(newMarkers);
        map.setBounds(bounds);
        if (filteredData.length <= 10 && userId) connectToSSE(userId, filteredData);
      } else {
        alert("검색 결과가 없습니다.");
      }
    });
  };

  //SSE 연결 함수
  const connectToSSE = (userId, data) => {
    const params = new URLSearchParams();
    params.append('restaurantId', data.map(place => place.id).join(','));
    params.append('x', data.map(place => place.x).join(','));
    params.append('y', data.map(place => place.y).join(','));
    params.append('name', data.map(place => place.place_name).join(','));
    params.append('placeUrl', data.map(place => place.place_url).join(','));

    const url = `http://localhost:8080/maps/${userId}?${params.toString()}`;
    eventSourceRef.current = new EventSource(url);

    eventSourceRef.current.addEventListener('connect', (event) => {
      const data = JSON.parse(event.data);
      updateMapWithWaitingData(data);
    });

    eventSourceRef.current.addEventListener('update', (event) => {
      const updatedData = JSON.parse(event.data);
      updateSingleMarker(updatedData);
    });

    eventSourceRef.current.onclose = () => {
      console.log('SSE 연결이 서버에서 종료되었습니다.');
    };

    eventSourceRef.current.onerror = (error) => {
      console.error('SSE 연결 오류 발생:', error);
      eventSourceRef.current.close();
    };
  };

  
  //첫 연결 시, 연결에 넣은 식당에 대한 실시간 대기열 표시, 식당이 1개일 경우 나의 대기 순번과 대기 예상시간 까지 표시(대기 중이 아닐 경우 안나옴)
  const updateMapWithWaitingData = (data) => {
    data.forEach(item => {
      const existingMarker = sseMarkersRef.current.get(item.restaurantId);
      const existingOverlay = sseOverlaysRef.current.get(item.restaurantId);
  
      // 기존 마커 및 오버레이 제거
      if (existingMarker) {
        existingMarker.setMap(null);
        sseMarkersRef.current.delete(item.restaurantId);
      }
      if (existingOverlay) {
        existingOverlay.setMap(null);
        sseOverlaysRef.current.delete(item.restaurantId);
      }
  
      const position = new window.kakao.maps.LatLng(parseFloat(item.y), parseFloat(item.x));
      const marker = new window.kakao.maps.Marker({ map: map, position: position });
  
      let overlayContent = `
        <div class="customoverlay">
          <a href="${item.placeUrl}" target="_blank"> 
            <span class="title">${item.restaurantName}</strong><br/>대기 인원: ${item.waiting}</span>  
          </a>`;

        console.log(overlayContent);

      if (item.myWaiting !== null && item.myWaiting > 0) {
        overlayContent += `<span class="waiting">나의 대기 순위: ${item.myWaiting}</span>`;
      }
      if (item.waitingTime !== null && item.waitingTime > 0) {
        overlayContent += `<span class="waiting">나의 예상 대기 시간: ${item.waitingTime}분</span>`;
      }

      overlayContent += `</div>`;
  
      const customOverlay = new window.kakao.maps.CustomOverlay({
        position: position,
        yAnchor: 0,
        content: overlayContent
      });
      
      customOverlay.setMap(map);
  

      marker.addListener("click", () => {
        console.log(`마커 클릭: ${item.restaurantName}`);

        if (!userId.trim()) {
          alert('유저 ID를 입력하세요.');
          return;
        }
        disconnectSSE().then(() => {
          console.log("🔗 기존 SSE 연결 종료 후 새로운 SSE 연결 시작...");
          connectToSSE(userId, [{ id: item.restaurantId, x: item.x, y: item.y, place_name: item.restaurantName }]);
        });
        
    });

    sseMarkersRef.current.set(item.restaurantId, marker);
    sseOverlaysRef.current.set(item.restaurantId, customOverlay);

    });
  };
  
  //조회 중인 식당의 대기열 변경 시 그 식당의 대기열 업데이트, 그 식당에 대기신청을 했을 경우, 나의 대기 순위와 예상 대기 시간도 표시 
  const updateSingleMarker = (updateData) => {
    const existingMarker = sseMarkersRef.current.get(updateData.restaurantId);
    const existingOverlay = sseOverlaysRef.current.get(updateData.restaurantId);
  
    // 기존 마커 및 오버레이 제거
    if (existingMarker) {
      existingMarker.setMap(null);
      sseMarkersRef.current.delete(updateData.restaurantId);
    }
    if (existingOverlay) {
      existingOverlay.setMap(null);
      sseOverlaysRef.current.delete(updateData.restaurantId);
    }
  
    const position = new window.kakao.maps.LatLng(parseFloat(updateData.y), parseFloat(updateData.x));
    const marker = new window.kakao.maps.Marker({ map: map, position: position });
  
    let overlayContent = `
        <div class="customoverlay">
          <a href="${updateData.placeUrl}" target="_blank"> 
            <span class="title">${updateData.restaurantName}</strong><br/>대기 인원: ${updateData.waiting}</span>
          </a>`;

    if (updateData.myWaiting !== null && updateData.myWaiting > 0) {
      overlayContent += `<span class="waiting">나의 대기 순위: ${updateData.myWaiting}`;
    }
    if (updateData.waitingTime !== null && updateData.waitingTime > 0) {
      overlayContent += `<span class="waiting">나의 예상 대기 시간: ${updateData.waitingTime}분`;
    }

    overlayContent += `</div>`;
  
    const customOverlay = new window.kakao.maps.CustomOverlay({
      position: position,
      yAnchor: 0,
      content: overlayContent
    });
  
    customOverlay.setMap(map);
  
    sseMarkersRef.current.set(updateData.restaurantId, marker);
    sseOverlaysRef.current.set(updateData.restaurantId, customOverlay);
  };
  
  //하단부에 검색된 식당 리스트 표시 (임시 검색 결과 확인용)
  return (
    <div>
      <div style={{ padding: '10px', textAlign: 'center' }}>
        <input type="text" value={searchKeyword} onChange={(e) => setSearchKeyword(e.target.value)} placeholder="검색어를 입력하세요 (예: 맛집)" style={{ width: '50%', padding: '8px', fontSize: '16px' }} />
        <input type="text" value={userId} onChange={(e) => setUserId(e.target.value)} placeholder="유저 ID 입력" style={{ width: '20%', padding: '8px', marginLeft: '10px', fontSize: '16px' }} />
        <button onClick={handleSearch} style={{ padding: '8px 16px', marginLeft: '10px', fontSize: '16px', cursor: 'pointer' }}>검색</button>
      </div>
      <div id="map" style={{ width: '100%', height: '500px', border: '1px solid #000' }}></div>
      <div style={{ padding: '10px' }}>
        <h2>검색 결과</h2>
        <ul>
          {places.map((place, index) => (
            <li key={index} style={{ marginBottom: '10px' }}>
              <strong>{place.place_name}</strong><br />
              주소: {place.road_address_name || place.address_name}<br />
              전화번호: {place.phone || '전화번호 없음'}<br />
              <a href={place.place_url} target="_blank" rel="noopener noreferrer">지도에서 보기</a>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default MapComponent;
const loadKakaoMap = () => {
  return new Promise((resolve, reject) => {
    if (window.kakao && window.kakao.maps) {
      console.log("✅ Kakao Maps already loaded!");
      resolve(window.kakao);
      return;
    }

    const existingScript = document.querySelector('script[src^="https://dapi.kakao.com/v2/maps/sdk.js"]');
    if (existingScript) {
      console.log("✅ Kakao Maps script tag already exists, waiting for it to load...");
      existingScript.onload = () => {
        window.kakao.maps.load(() => resolve(window.kakao)); // API 초기화
      };
      existingScript.onerror = () => reject(new Error("❌ Kakao Maps script failed to load"));
      return;
    }

    const script = document.createElement("script");
    script.src = `https://dapi.kakao.com/v2/maps/sdk.js?appkey=${import.meta.env.VITE_KAKAO_API_JS_KEY}&autoload=false`;
    script.onload = () => {
      console.log("✅ Kakao Maps script loaded!");
      window.kakao.maps.load(() => resolve(window.kakao)); // API 초기화
    };
    script.onerror = () => reject(new Error("❌ Kakao Maps script failed to load"));
    document.head.appendChild(script);
  });
};

export default loadKakaoMap;
  
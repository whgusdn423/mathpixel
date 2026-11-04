// ===== 수학 픽셀 스터디 설정 파일 =====
// ① Firebase 콘솔 → 프로젝트 설정 → 내 앱(웹)에 있는 firebaseConfig 를 복사해서
//    아래 { ... } 부분을 통째로 바꿔 넣으세요. (따옴표와 쉼표까지 그대로)
const firebaseConfig = {
  apiKey: "AIzaSyBSQ6y87gf1TCUgB4JhcQgh2wkPRRKrRiM",
  authDomain: "mathmath-52884.firebaseapp.com",
  projectId: "mathmath-52884",
  storageBucket: "mathmath-52884.firebasestorage.app",
  messagingSenderId: "434469659314",
  appId: "1:434469659314:web:040abde132ff561a8d5fab",
  measurementId: "G-SRWW0C5ZPP"
};

// ② 아래는 고치지 않아도 됩니다.
window.MP_CONFIG = {
  firebase: firebaseConfig,
  // homeUrl: "https://아이디.github.io/mathpixel/",   // QR 코드 주소를 따로 정하고 싶을 때만 앞의 // 를 지우고 쓰세요.
};

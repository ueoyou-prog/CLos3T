# Muse Closet

핀터레스트 감성의 날씨 기반 디지털 옷장 웹앱입니다. GitHub Pages에 바로 올릴 수 있는 정적 웹앱 구조입니다.

## 기능

- 회원가입/로그인 데모
- 아이디/비밀번호 String 검증
- 성별, 키, 몸무게, 체형, 선호 스타일 저장
- 이미지 업로드 및 옷 메타데이터 저장
- 카테고리별 옷장 조회 및 삭제
- Geolocation API로 현재 위치 획득
- Open-Meteo 날씨 API로 현재 기온/최저/최고/날씨 불러오기
- 기온, 두께감, 선호 스타일, 색상 매칭 기반 추천 3세트 생성
- 착용 완료 시 User_History 형태로 localStorage 저장

## 실행 방법

1. 이 폴더를 GitHub 저장소에 업로드합니다.
2. GitHub 저장소 Settings → Pages로 이동합니다.
3. Branch를 `main`, 폴더를 `/root`로 설정합니다.
4. 발급된 GitHub Pages 주소로 접속합니다.

## 파일 구조

```txt
index.html   화면 구조
styles.css   애플/핀터레스트 감성 UI 스타일
app.js       데이터 저장, 날씨, 옷장 CRUD, 추천 알고리즘
README.md    설명서
```

## 실제 백엔드 확장 포인트

현재 버전은 제출/시연용으로 localStorage를 DB처럼 사용합니다. 실제 서버를 붙이면 아래처럼 바꾸면 됩니다.

- `loadDB`, `saveDB` → Firebase/Supabase/Express API 호출로 교체
- `removeBackgroundDemo` → Python `rembg` 서버 또는 이미지 배경 제거 API 연결
- Open-Meteo API → 과제 요구사항에 맞게 기상청 단기예보 API로 교체

## 제목

사이트 제목은 `Muse Closet`이며, 화면 어디에도 AI라는 단어를 쓰지 않았습니다.

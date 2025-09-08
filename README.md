# Image-to-HTML-Converter

이미지 안의 텍스트를 인식하여 구조화된 HTML 코드로 변환해주는 도구입니다.
스크린샷이나 이미지에 담긴 텍스트를 빠르게 추출하고, 바로 웹이나 백오피스에 활용할 수 있도록 지원합니다.

---

## 📌 사용 시점 [핀테크]

### 1. 최초 심의안 제작 (초안 단계)
- **목적**: AI를 활용해 심의 파일을 **초안 수준에서 제작 가능 여부 검토**
- 검토 사항:
  - 어떤 방식으로 초안 제작이 가능한가?  
  - 자동화/AI 활용 범위를 어디까지 둘 것인가?  

### 2. 최종 심의안 제작 (심의 완료본 반영 단계)
- **목적**: 카드사 심의 결과와 **100% 일치하는 최종본 제작**  
- 필수 조건:
  - 심의 내용 및 결과와 완벽하게 동일해야 함  
  - **인식률(정확도) 극대화**  

---

## 🚀 2차 개선안

### 핵심 요약

#### 1. 정확도 개선
- **문제점**: 기존 자동화는 1차 제작본(아정당 → 카드사)에는 적합했으나  
  2차 제작본(카드사 → 아정당 : 심의 완료본) 인식 정확도가 낮음  
- **개선방법**: 기존 GPT API 대신 **Gemini API**를 적용하여 인식 정확도 향상  

---

#### 2. 변환 과정 단일화
- **문제점**: 기존에는  
  ① GPTs에서 HTML 변환 → ② CodePen 앱에서 재변환  
  이렇게 **2단계 과정**이 필요했음  
- **개선방법**: **원플로우(One-flow)** 프로세스로 개선  
  - 스크린샷 업로드 → 즉시 백오피스 입력용 변환 결과 제공  

---

## 🌐 최종 앱

👉 [Image-to-HTML Converter](https://image-to-html-converter-1088665625892.us-west1.run.app/)

---

## 📖 사용법

1. **이미지 캡쳐 후 붙여넣기**  
   <img width="400" height="481" alt="image" src="https://github.com/user-attachments/assets/c85d9b22-c2b6-4597-ae01-42e6bf98a35a" />


2. **Convert to HTML 버튼 클릭**  
   <img width="400" height="647" alt="image" src="https://github.com/user-attachments/assets/9aa86b02-63f2-42e2-8c25-cb72a054ac02" />


3. **변환된 내용 복사하여 사용**  
   <img width="400" height="665" alt="image" src="https://github.com/user-attachments/assets/a5c5b091-f73b-41b0-8290-7ea998d2e0ef" />

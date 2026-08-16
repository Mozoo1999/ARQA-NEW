const form = document.querySelector("#voice-command-form");
const transcript = document.querySelector("#voice-command-text");
const startButton = document.querySelector("#start-voice");
const result = document.querySelector("#voice-command-result");
const preview = document.querySelector("#voice-command-preview");

const wordThousands = { "عشرة": 10, "عشر": 10, "ثلاثين": 30, "ثلاثون": 30 };

function normalize(text) {
  return text.trim().replace(/[ًٌٍَُِّْـ]/g, "").replace(/[إأآ]/g, "ا").replace(/ى/g, "ي").replace(/[٠-٩]/g, (d) => "٠١٢٣٤٥٦٧٨٩".indexOf(d)).replace(/\s+/g, " ");
}

function amount(text) {
  const cleaned = normalize(text);
  const numeric = cleaned.match(/(\d+(?:\.\d+)?)\s*(?:الف|الاف|جنيه|جنيها)/);
  if (numeric) return Number(numeric[1]) * (/(?:الف|الاف)/.test(numeric[0]) ? 1000 : 1);
  const words = cleaned.match(/(عشرة|عشر|ثلاثين|ثلاثون)\s+(?:الف|الاف)/);
  return words ? wordThousands[words[1]] * 1000 : null;
}

function parse(text) {
  const cleaned = normalize(text);
  const money = amount(cleaned);
  const installment = cleaned.match(/قسط.*?(?:على سيارة|على مركبة)\s+(.+)$/);
  if (installment && money) {
    return {
      title: "مسودة قسط",
      body: `قسط بقيمة ${money.toLocaleString("ar-EG")} جنيه على سيارة/أصل «${installment[1]}».`,
      status: "يتطلب مطابقة الأصل وتأكيد المستخدم قبل الحفظ المالي.",
    };
  }
  const payment = cleaned.match(/(?:استلام|تسجيل) دفعة.*?من\s+(.+)$/);
  if (payment && money) {
    const method = cleaned.includes("فودافون كاش") ? " — وسيلة السداد: فودافون كاش" : "";
    return {
      title: "مسودة تحصيل",
      body: `دفعة بقيمة ${money.toLocaleString("ar-EG")} جنيه من «${payment[1]}»${method}.`,
      status: "يتطلب مطابقة العميل ومرجع التحويل ثم التأكيد.",
    };
  }
  return {
    title: "الأمر غير مكتمل",
    body: "تعذر تحديد نوع العملية أو المبلغ أو الجهة المستهدفة.",
    status: "يمكنك تعديل النص أو قول الأمر بصياغة أوضح.",
  };
}

function show(text) {
  const command = parse(text);
  preview.hidden = false;
  result.innerHTML = `<strong>${command.title}</strong><span>${command.body}</span><small>${command.status}</small>`;
}

form.addEventListener("submit", (event) => {
  event.preventDefault();
  if (transcript.value.trim()) show(transcript.value);
});

const Recognition = window.SpeechRecognition || window.webkitSpeechRecognition;
if (Recognition) {
  startButton.addEventListener("click", () => {
    const recognition = new Recognition();
    recognition.lang = "ar-EG";
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;
    startButton.disabled = true;
    startButton.textContent = "جارٍ الاستماع…";
    recognition.onresult = (event) => {
      transcript.value = event.results[0][0].transcript;
      show(transcript.value);
    };
    recognition.onerror = () => {
      result.textContent = "تعذر التقاط الصوت. اكتب الأمر أو تحقق من إذن الميكروفون.";
      preview.hidden = false;
    };
    recognition.onend = () => {
      startButton.disabled = false;
      startButton.textContent = "ابدأ أمرًا صوتيًا";
    };
    recognition.start();
  });
} else {
  startButton.disabled = true;
  startButton.title = "المتصفح لا يدعم التعرف على الصوت.";
}

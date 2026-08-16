const inbox = document.querySelector("#suggestions-inbox");
const feedback = document.querySelector("#suggestion-feedback");

inbox?.addEventListener("click", (event) => {
  const action = event.target.closest("button")?.dataset.action;
  if (!action) return;

  if (action === "approve") {
    feedback.textContent = "تم إنشاء مسودة تحصيل مرتبطة بالعميل. راجع المرجع ثم أكدها.";
  }
  if (action === "dismiss") {
    feedback.textContent = "تم تجاهل الاقتراح. لن تُنشأ أي حركة مالية.";
  }
});

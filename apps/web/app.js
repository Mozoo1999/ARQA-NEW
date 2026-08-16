const form = document.querySelector("#quote-form");
const egp = new Intl.NumberFormat("ar-EG", {
  style: "currency",
  currency: "EGP",
  maximumFractionDigits: 2,
});

const number = (formData, name) => Number(formData.get(name) || 0);
const money = (value) => egp.format(value);
const round = (value) => Math.round((value + Number.EPSILON) * 100) / 100;

function calculate(formData) {
  const quantity = number(formData, "quantity");
  const purchase = number(formData, "purchase");
  const transport = number(formData, "transport");
  const loading = number(formData, "loading");
  const extras = number(formData, "extras");
  const payload = number(formData, "payload");
  const waste = number(formData, "waste") / 100;
  const admin = number(formData, "admin") / 100;
  const profit = number(formData, "profit") / 100;

  if (quantity <= 0 || payload <= 0 || waste < 0 || waste >= 1) {
    throw new Error("تحقق من الكمية والحمولة ونسبة الهالك.");
  }

  const components = [
    ["شراء المادة", purchase],
    ["النقل", transport],
    ["التحميل", loading],
    ["رسوم ومصروفات إضافية", extras],
  ];
  const baseTotal = components.reduce((total, [, perUnit]) => total + perUnit * quantity, 0);
  const requiredSourceQuantity = quantity / (1 - waste);
  const wasteTotal = baseTotal * (requiredSourceQuantity / quantity - 1);
  const landedTotal = baseTotal + wasteTotal;
  const adminTotal = landedTotal * admin;
  const beforeProfit = landedTotal + adminTotal;
  const profitTotal = beforeProfit * profit;

  return {
    requiredSourceQuantity,
    trips: Math.ceil(requiredSourceQuantity / payload),
    landedTotal,
    totalPrice: beforeProfit + profitTotal,
    lines: [
      ...components.map(([label, perUnit]) => ({ label, perUnit, total: perUnit * quantity })),
      { label: "أثر الهالك", perUnit: wasteTotal / quantity, total: wasteTotal },
      { label: "مصروف إداري", perUnit: adminTotal / quantity, total: adminTotal },
      { label: "هامش الربح", perUnit: profitTotal / quantity, total: profitTotal },
    ],
  };
}

function render(result) {
  document.querySelector("#recommended-price").textContent = money(result.totalPrice / number(new FormData(form), "quantity"));
  document.querySelector("#landed-cost").textContent = money(result.landedTotal / number(new FormData(form), "quantity"));
  document.querySelector("#total-price").textContent = money(result.totalPrice);
  document.querySelector("#trip-count").textContent = `${result.trips} نقلة تقريبًا / ${round(result.requiredSourceQuantity).toLocaleString("ar-EG")} طن من المصدر`;

  document.querySelector("#cost-lines").innerHTML = result.lines
    .map((line) => `<tr><td>${line.label}</td><td>${money(line.perUnit)}</td><td>${money(line.total)}</td></tr>`)
    .join("");
}

function update(event) {
  event?.preventDefault();
  try {
    render(calculate(new FormData(form)));
  } catch (error) {
    alert(error.message);
  }
}

form.addEventListener("submit", update);
form.addEventListener("input", update);
update();

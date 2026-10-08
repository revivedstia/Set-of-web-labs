// app.js — журнал студентов. Данные хранятся в массивах, страница строится функцией render().

// ---------- Замыкания и проверка ----------

// Генератор id: last живёт в замыкании, каждая запись получает уникальный номер.
function createIdGenerator() {
  let last = 0;
  return () => {
    last += 1;
    return last;
  };
}

function createMinScoreFilter(min) {
  return student => student.score >= min;
}

// Пустоту проверяем до Number: Number("") равно 0.
function validateScore(raw) {
  const text = raw.trim().replace(",", ".");
  if (text === "") return { ok: false, reason: "введите балл" };
  const value = Number(text);
  if (!Number.isFinite(value)) return { ok: false, reason: "балл должен быть числом" };
  if (value < 0 || value > 100) return { ok: false, reason: "балл должен быть от 0 до 100" };
  return { ok: true, value };
}

// ---------- Состояние ----------
// Статус («Сдал» / «Пересдача») не хранится: он вычисляется в render() по текущему порогу.

let students = [];   // { id, name, score }
let rejected = [];   // { name, raw, reason }
let passScore = 60;
const nextId = createIdGenerator();

// Возвращает текст ошибки или "" при успехе.
function tryAdd(name, rawScore) {
  const cleanName = name.trim();
  let error = "";
  let value = null;

  if (cleanName === "") {
    error = "Введите имя студента.";
  } else {
    const result = validateScore(rawScore);
    if (result.ok) value = result.value;
    else error = `Балл: ${result.reason}.`;
  }

  if (error) {
    rejected.push({ name: cleanName || "(без имени)", raw: rawScore.trim(), error });
    return error;
  }
  students.push({ id: nextId(), name: cleanName, score: value });
  return "";
}

// ---------- Отображение ----------

const rowsBody = document.querySelector("#rows");
const table = document.querySelector("#journal");
const emptyMessage = document.querySelector("#empty");
const counts = document.querySelector("#counts");
const rejectedBox = document.querySelector("#rejected-box");
const rejectedList = document.querySelector("#rejected");

function textCell(text) {
  const td = document.createElement("td");
  td.textContent = text;
  return td;
}

function render() {
  const isPassed = createMinScoreFilter(passScore);
  rowsBody.replaceChildren();

  for (const student of students) {
    const passed = isPassed(student);
    const tr = document.createElement("tr");
    tr.dataset.id = student.id;

    const status = textCell(passed ? "Сдал" : "Пересдача");
    status.className = passed ? "status passed" : "status retake";

    const button = document.createElement("button");
    button.type = "button";
    button.className = "remove";
    button.dataset.id = student.id;
    button.textContent = "Удалить";
    button.setAttribute("aria-label", `Удалить: ${student.name}`);
    const actions = document.createElement("td");
    actions.append(button);

    tr.append(textCell(student.name), textCell(String(student.score)), status, actions);
    rowsBody.append(tr);
  }

  counts.textContent = `Показано записей: ${students.length}, отклонено: ${rejected.length}.`;
  table.hidden = students.length === 0;
  emptyMessage.hidden = students.length > 0;

  rejectedList.replaceChildren();
  for (const item of rejected) {
    const li = document.createElement("li");
    li.textContent = `${item.name}: «${item.raw}». ${item.error}`;
    rejectedList.append(li);
  }
  rejectedBox.hidden = rejected.length === 0;
}

// ---------- События ----------

const form = document.querySelector("#add-form");
const nameInput = document.querySelector("#name");
const scoreInput = document.querySelector("#score");
const formError = document.querySelector("#form-error");
const passInput = document.querySelector("#pass-score");
const passError = document.querySelector("#pass-error");

// Один обработчик submit: и кнопка, и Enter в поле запускают его ровно один раз.
form.addEventListener("submit", event => {
  event.preventDefault();
  const error = tryAdd(nameInput.value, scoreInput.value);
  formError.textContent = error;
  if (!error) {
    form.reset();
    nameInput.focus();
  }
  render();
});

// Делегирование: строки создаются заново, поэтому слушаем родителя.
rowsBody.addEventListener("click", event => {
  const button = event.target.closest(".remove");
  if (!button) return;
  const id = Number(button.dataset.id);
  students = students.filter(student => student.id !== id);
  render();
});

// Порог меняет статусы, записи не удаляются. Неверный ввод порог не меняет.
passInput.addEventListener("input", () => {
  const result = validateScore(passInput.value);
  if (!result.ok) {
    passError.textContent = `Проходной балл: ${result.reason}.`;
    return;
  }
  passError.textContent = "";
  passScore = result.value;
  render();
});

// ---------- Запуск ----------

const initial = [["Анна", "75"], ["Борис", "40"], ["Вера", "60"], ["Глеб", ""], ["Дарья", "abc"]];
for (const [name, score] of initial) tryAdd(name, score);
render();

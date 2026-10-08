// app.js — модуль обработки результатов студентов (лабораторные 3.1 и 3.2).
// Подключается как ES-модуль, поэтому работает в строгом режиме.

const PASS_SCORE = 60;

// ---------- Вывод: в Console и на страницу ----------

const output = document.querySelector("#output");

function print(...parts) {
  console.log(...parts);
  const line = parts
    .map(part => (typeof part === "string" ? part : JSON.stringify(part)))
    .join(" ");
  output.textContent += line + "\n";
}

// ---------- Замыкания ----------

// Счётчик проверок. count живёт в замыкании: снаружи его можно
// только увеличить или прочитать. Каждый вызов даёт независимый счётчик.
function createCheckCounter() {
  let count = 0;
  return {
    increment() {
      count += 1;
    },
    get() {
      return count;
    },
  };
}

// Фабрика фильтра: порог запоминается в замыкании,
// студент приходит при каждом вызове колбэка.
function createMinScoreFilter(min) {
  return student => student.score >= min;
}

// ---------- Проверка данных ----------

// Возвращает { ok: true, value } или { ok: false, reason }.
// Порядок важен: Number("") равно 0, поэтому пустоту отсекаем до преобразования.
function validateScore(raw, counter) {
  counter.increment();

  if (typeof raw !== "string") {
    return { ok: false, reason: "балл должен быть строкой" };
  }
  const text = raw.trim();
  if (text === "") {
    return { ok: false, reason: "пустое значение" };
  }
  const value = Number(text);
  if (!Number.isFinite(value)) {
    return { ok: false, reason: "не число" };
  }
  if (value < 0 || value > 100) {
    return { ok: false, reason: "вне диапазона 0–100" };
  }
  return { ok: true, value };
}

// ---------- Обработка массива ----------

function calcStats(accepted) {
  if (accepted.length === 0) {
    return { count: 0, average: null, min: null, max: null, passed: [] };
  }
  let total = 0;
  for (const student of accepted) {
    total += student.score;
  }
  const scores = accepted.map(student => student.score);
  return {
    count: accepted.length,
    // Делим на число принятых записей, а не на длину исходного массива.
    average: total / accepted.length,
    min: Math.min(...scores),
    max: Math.max(...scores),
    passed: accepted.filter(createMinScoreFilter(PASS_SCORE)).map(s => s.name),
  };
}

// Исходный массив не изменяется: принятые записи — новые объекты.
function processStudents(students, counter) {
  const accepted = [];
  const rejected = [];

  for (const student of students) {
    const result = validateScore(student.score, counter);
    if (result.ok) {
      accepted.push({ ...student, score: result.value });
    } else {
      rejected.push({ name: student.name, raw: student.score, reason: result.reason });
    }
  }
  return { accepted, rejected, stats: calcStats(accepted) };
}

function report(title, students) {
  const before = JSON.stringify(students);
  const counter = createCheckCounter();
  const { accepted, rejected, stats } = processStudents(students, counter);

  print(`=== ${title} ===`);
  print("Принятые записи:", accepted);
  print("Отклонённые записи:", rejected);
  print("Статистика:", {
    ...stats,
    average: stats.average === null ? "нет оценок" : Number(stats.average.toFixed(2)),
  });
  print("Проверок выполнено:", counter.get());
  print("Исходный массив не изменён:", JSON.stringify(students) === before);

  if (accepted.length > 0) {
    const passed = createMinScoreFilter(60);
    const excellent = createMinScoreFilter(85);
    print("Порог 60:", accepted.filter(passed).map(s => s.name));
    print("Порог 85:", accepted.filter(excellent).map(s => s.name));
  }
  print("");
}

// ---------- Потеря this и два исправления ----------

function demoThis() {
  const journal = {
    title: "Web",
    getTitle() {
      return this.title;
    },
  };

  print("=== this ===");
  print("journal.getTitle():", journal.getTitle());

  const lost = journal.getTitle; // метод вытащили из объекта
  try {
    print("lost():", lost());
  } catch (error) {
    // В строгом режиме this равен undefined, чтение title даёт TypeError.
    print("lost() → ошибка:", `${error.name}: ${error.message}`);
  }

  const bound = journal.getTitle.bind(journal); // исправление 1: bind
  const wrapped = () => journal.getTitle(); //      исправление 2: обёртка
  print("bind:", bound());
  print("обёртка:", wrapped());
  print("");
}

// ---------- Данные и запуск ----------

const students = [
  { name: "Анна", score: " 75 " },
  { name: "Борис", score: "40" },
  { name: "Вера", score: "60" },
  { name: "Глеб", score: "" },
  { name: "Дарья", score: "abc" },
  { name: "Егор", score: "105" },
  { name: "Жанна", score: "89.5" },
  { name: "Зоя", score: "0" },
  { name: "Иван", score: "-5" },
];

report("Основной набор", students);
report("Пустой массив", []);
report("Нет корректных баллов", [
  { name: "Тест 1", score: "abc" },
  { name: "Тест 2", score: "   " },
]);
demoThis();

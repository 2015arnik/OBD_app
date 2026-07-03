export function formatBirthday(dateString) {
  if (!dateString) {
    return "Дата не указана";
  }

  return new Intl.DateTimeFormat("ru-RU", {
    day: "numeric",
    month: "long"
  }).format(new Date(dateString));
}

export function formatFullDate(dateString) {
  if (!dateString) {
    return "Дата не указана";
  }

  return new Intl.DateTimeFormat("ru-RU", {
    day: "numeric",
    month: "long",
    year: "numeric"
  }).format(new Date(dateString));
}

export function formatDateTime(dateString) {
  if (!dateString) {
    return "Только что";
  }

  return new Intl.DateTimeFormat("ru-RU", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit"
  }).format(new Date(dateString));
}

export function formatIsoDate(dateString) {
  if (!dateString) {
    return "Не указан";
  }

  return new Intl.DateTimeFormat("ru-RU", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric"
  }).format(new Date(dateString));
}

export function formatMoney(value) {
  if (value === null || value === undefined || Number.isNaN(Number(value))) {
    return "Цена не указана";
  }

  return new Intl.NumberFormat("ru-RU", {
    style: "currency",
    currency: "RUB",
    maximumFractionDigits: 0
  }).format(Number(value));
}

export function formatDaysUntilBirthday(days) {
  if (days === null || days === undefined) {
    return "Дата не указана";
  }

  if (days === 0) {
    return "Сегодня";
  }

  if (days === 1) {
    return "Завтра";
  }

  return `Через ${days} дн.`;
}

export function giftStatusLabel(status) {
  switch (status) {
    case "RESERVED":
      return "Зарезервирован";
    case "BOUGHT":
      return "Куплен";
    case "WANTED":
    default:
      return "Хочу получить";
  }
}

export function subscriptionLabel(targetType) {
  return targetType === "GROUP" ? "Подписка на группу" : "Подписка на друга";
}

export function initials(name) {
  if (!name) {
    return "OB";
  }

  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() || "")
    .join("");
}

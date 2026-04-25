export function formatMoneyCents(amountCents: number, locale = "pt-BR", currency = "BRL") {
  return new Intl.NumberFormat(locale, {
    currency,
    style: "currency",
  }).format(amountCents / 100);
}

export function MobileCodingRow({ onInsert }: { onInsert: (value: string) => void }) {
  const symbols = ['()', '{}', '""', "''", '=', ';', '  ']
  return (
    <div className="coding-row" aria-label="Coding symbols">
      {symbols.map((symbol) => <button type="button" key={symbol} onClick={() => onInsert(symbol)} aria-label={symbol === '  ' ? 'Insert two spaces' : `Insert ${symbol}`}>{symbol === '  ' ? 'Tab' : symbol}</button>)}
    </div>
  )
}

import { NextResponse } from 'next/server';

export async function GET() {
  const symbols = [
    'BTCUSDT', 'ETHUSDT', 'LTCUSDT', 'XRPUSDT', 'BCHUSDT', 
    'ETCUSDT', 'FILUSDT', 'USDCUSDT', 'SUNUSDT', 'DOTUSDT', 
    'ADAUSDT', 'DOGEUSDT'
  ];

  try {
    const promises = symbols.map(s => 
      fetch(`https://api.binance.com/api/v3/ticker/24hr?symbol=${s}`)
        .then(res => res.json())
        .catch(() => null)
    );

    const results = await Promise.all(promises);
    return NextResponse.json(results.filter(r => r !== null));
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch prices' }, { status: 500 });
  }
}

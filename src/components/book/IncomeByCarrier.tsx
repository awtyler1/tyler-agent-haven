import type { CarrierIncome } from '@/types/book';

interface IncomeByCarrierProps {
  carriers: CarrierIncome[];
  totalIncome: number;
}

export function IncomeByCarrier({ carriers, totalIncome }: IncomeByCarrierProps) {
  const maxIncome = carriers.length > 0 ? carriers[0].income : 1;

  return (
    <div
      className="rounded-2xl p-7"
      style={{ background: 'linear-gradient(135deg, #1C1A16 0%, #2A2720 100%)' }}
    >
      <div className="flex justify-between items-center mb-6">
        <span className="text-[16px] font-semibold" style={{ color: '#FAFAF8' }}>Income by Carrier</span>
        <span className="text-[12px]" style={{ color: '#A09888' }}>Projected annual</span>
      </div>

      {carriers.map((c, i) => (
        <div key={c.carrier_id} className="mb-5">
          <div className="flex justify-between items-baseline mb-2">
            <div className="flex items-center gap-2.5">
              <div className="w-3 h-3 rounded" style={{ background: c.color }} />
              <span className="text-[15px] font-medium" style={{ color: '#FAFAF8' }}>{c.carrier_name}</span>
              <span className="text-[13px]" style={{ color: '#A09888' }}>{c.policies} policies</span>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-[13px]" style={{ color: '#A09888' }}>{c.percentage}%</span>
              <span className="text-[18px] font-bold" style={{ color: '#FAFAF8' }}>
                ${c.income.toLocaleString()}
              </span>
            </div>
          </div>
          <div className="h-2 rounded" style={{ background: 'rgba(255,255,255,0.06)' }}>
            <div
              className="h-full rounded transition-all duration-700"
              style={{ width: `${(c.income / maxIncome) * 100}%`, background: c.color }}
            />
          </div>
        </div>
      ))}

      {/* Total */}
      <div
        className="mt-7 px-5 py-4.5 rounded-xl"
        style={{
          background: 'rgba(200,169,81,0.08)',
          border: '1px solid rgba(200,169,81,0.15)',
        }}
      >
        <div className="flex justify-between items-center">
          <div>
            <div className="text-[13px] mb-0.5" style={{ color: '#A09888' }}>Total Annual Renewals</div>
            <div className="text-[28px] font-bold tracking-tight" style={{ color: '#C8A951' }}>
              ${totalIncome.toLocaleString()}
            </div>
          </div>
          <div className="text-right">
            <div className="text-[13px] mb-0.5" style={{ color: '#A09888' }}>Monthly Average</div>
            <div className="text-[20px] font-bold" style={{ color: '#D4C9B0' }}>
              ${Math.round(totalIncome / 12).toLocaleString()}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

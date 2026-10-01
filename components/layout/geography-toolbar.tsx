'use client';

import { useGeography } from '@/lib/ward-context';
import { useI18n } from '@/lib/i18n-context';

const STATES = [
  'All States',
  'Tamil Nadu',
  'Maharashtra',
  'Karnataka',
  'Uttar Pradesh',
  'Gujarat',
  'West Bengal',
  'Rajasthan',
  'Kerala',
  'Madhya Pradesh',
  'Delhi',
  'Bihar',
  'Telangana',
  'Andhra Pradesh',
  'Punjab',
  'Haryana',
  'Odisha',
  'Assam',
];

const DISTRICTS_MAP: Record<string, string[]> = {
  'Tamil Nadu': ['All Districts', 'Chennai', 'Coimbatore', 'Madurai', 'Tiruchirappalli', 'Salem', 'Tirunelveli', 'Erode', 'Vellore'],
  Maharashtra: ['All Districts', 'Mumbai', 'Pune', 'Nagpur', 'Thane', 'Nashik', 'Aurangabad', 'Solapur', 'Kolhapur'],
  Karnataka: ['All Districts', 'Bengaluru Urban', 'Mysuru', 'Hubballi-Dharwad', 'Mangaluru', 'Belagavi', 'Kalaburagi'],
  'Uttar Pradesh': ['All Districts', 'Lucknow', 'Kanpur Nagar', 'Varanasi', 'Prayagraj', 'Agra', 'Ghaziabad', 'Noida'],
  Gujarat: ['All Districts', 'Ahmedabad', 'Surat', 'Vadodara', 'Rajkot', 'Bhavnagar', 'Jamnagar'],
  'West Bengal': ['All Districts', 'Kolkata', 'Howrah', 'North 24 Parganas', 'South 24 Parganas', 'Darjeeling'],
  Rajasthan: ['All Districts', 'Jaipur', 'Jodhpur', 'Udaipur', 'Kota', 'Ajmer', 'Bikaner'],
  Kerala: ['All Districts', 'Thiruvananthapuram', 'Ernakulam', 'Kozhikode', 'Thrissur', 'Kollam'],
  Delhi: ['All Districts', 'Central Delhi', 'New Delhi', 'South Delhi', 'North Delhi'],
};

export default function GeographyToolbar() {
  const {
    selectedState,
    setSelectedState,
    selectedDistrict,
    setSelectedDistrict,
    selectedWard,
    setSelectedWard,
    resetGeography,
  } = useGeography();
  const { t } = useI18n();

  const districtList =
    selectedState !== 'all' && DISTRICTS_MAP[selectedState]
      ? DISTRICTS_MAP[selectedState]
      : ['All Districts', 'Chennai', 'Mumbai', 'Bengaluru Urban', 'Lucknow', 'Ahmedabad', 'Kolkata', 'Jaipur', 'Pune'];

  const isFiltered = selectedState !== 'all' || selectedDistrict !== 'all' || selectedWard !== 'all';

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#E8EAED] pb-3 pt-1">
      <div className="flex flex-wrap items-center gap-2 text-xs">
        <span className="font-semibold uppercase tracking-wider text-[#5F6368]">
          Geography Scope:
        </span>

        {/* State select */}
        <select
          value={selectedState === 'all' ? 'All States' : selectedState}
          onChange={(e) => {
            const val = e.target.value;
            setSelectedState(val === 'All States' ? 'all' : val);
          }}
          className="h-8 rounded-md border border-[#DADCE0] bg-white px-2.5 py-1 text-xs font-medium text-[#202124] hover:bg-[#F8FAFC]"
        >
          {STATES.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>

        {/* District select */}
        <select
          value={selectedDistrict === 'all' ? 'All Districts' : selectedDistrict}
          onChange={(e) => {
            const val = e.target.value;
            setSelectedDistrict(val === 'All Districts' ? 'all' : val);
          }}
          className="h-8 rounded-md border border-[#DADCE0] bg-white px-2.5 py-1 text-xs font-medium text-[#202124] hover:bg-[#F8FAFC]"
        >
          {districtList.map((d) => (
            <option key={d} value={d}>
              {d}
            </option>
          ))}
        </select>

        {/* Ward select */}
        <select
          value={selectedWard}
          onChange={(e) => setSelectedWard(e.target.value)}
          className="h-8 rounded-md border border-[#DADCE0] bg-white px-2.5 py-1 text-xs font-medium text-[#202124] hover:bg-[#F8FAFC]"
        >
          <option value="all">{t('allWards') || 'All Wards'}</option>
          {Array.from({ length: 15 }, (_, i) => `Ward ${i + 1}`).map((w) => (
            <option key={w} value={w}>
              {w}
            </option>
          ))}
        </select>

        {isFiltered && (
          <button
            type="button"
            onClick={resetGeography}
            className="h-8 rounded-md border border-[#E8EAED] bg-[#F1F3F4] px-2.5 text-xs font-medium text-[#5F6368] hover:bg-[#E8EAED] hover:text-[#202124]"
          >
            Reset to India
          </button>
        )}
      </div>

      <div className="flex items-center gap-1.5 text-[11px] text-[#5F6368]">
        <span className="inline-block h-2 w-2 rounded-full bg-[#34A853]" />
        <span>India-ready multi-tier hierarchy</span>
      </div>
    </div>
  );
}

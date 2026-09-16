import { HolidayEvent, HolidayType, getAllHolidaysForYear } from './holidays';

export interface CountryInfo {
  code: string;
  name: string;
  flag: string;
}

export const SUPPORTED_COUNTRIES: CountryInfo[] = [
  { code: 'US', name: 'United States', flag: '🇺🇸' },
  { code: 'IN', name: 'India', flag: '🇮🇳' },
  { code: 'GB', name: 'United Kingdom', flag: '🇬🇧' },
  { code: 'CA', name: 'Canada', flag: '🇨🇦' },
  { code: 'AU', name: 'Australia', flag: '🇦🇺' },
  { code: 'DE', name: 'Germany', flag: '🇩🇪' },
  { code: 'FR', name: 'France', flag: '🇫🇷' },
  { code: 'JP', name: 'Japan', flag: '🇯🇵' },
  { code: 'SG', name: 'Singapore', flag: '🇸🇬' },
  { code: 'NZ', name: 'New Zealand', flag: '🇳🇿' },
  { code: 'BR', name: 'Brazil', flag: '🇧🇷' },
  { code: 'MX', name: 'Mexico', flag: '🇲🇽' },
  { code: 'IT', name: 'Italy', flag: '🇮🇹' },
  { code: 'ES', name: 'Spain', flag: '🇪🇸' },
  { code: 'NL', name: 'Netherlands', flag: '🇳🇱' },
  { code: 'CH', name: 'Switzerland', flag: '🇨🇭' },
  { code: 'SE', name: 'Sweden', flag: '🇸🇪' },
  { code: 'NO', name: 'Norway', flag: '🇳🇴' },
  { code: 'IE', name: 'Ireland', flag: '🇮🇪' },
  { code: 'ZA', name: 'South Africa', flag: '🇿🇦' },
  { code: 'AE', name: 'United Arab Emirates', flag: '🇦🇪' },
];

/**
 * Detect user country based on browser timezone and locale
 */
export function detectUserCountry(): CountryInfo {
  const saved = localStorage.getItem('user_holiday_country');
  if (saved) {
    const found = SUPPORTED_COUNTRIES.find((c) => c.code === saved);
    if (found) return found;
  }

  try {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || '';
    const tzLower = tz.toLowerCase();

    if (tzLower.includes('calcutta') || tzLower.includes('kolkata') || tzLower.includes('delhi') || tzLower.includes('india')) {
      return { code: 'IN', name: 'India', flag: '🇮🇳' };
    }
    if (tzLower.includes('london')) {
      return { code: 'GB', name: 'United Kingdom', flag: '🇬🇧' };
    }
    if (tzLower.includes('toronto') || tzLower.includes('vancouver') || tzLower.includes('montreal') || tzLower.includes('edmonton')) {
      return { code: 'CA', name: 'Canada', flag: '🇨🇦' };
    }
    if (tzLower.includes('sydney') || tzLower.includes('melbourne') || tzLower.includes('brisbane') || tzLower.includes('perth') || tzLower.includes('australia')) {
      return { code: 'AU', name: 'Australia', flag: '🇦🇺' };
    }
    if (tzLower.includes('berlin')) {
      return { code: 'DE', name: 'Germany', flag: '🇩🇪' };
    }
    if (tzLower.includes('paris')) {
      return { code: 'FR', name: 'France', flag: '🇫🇷' };
    }
    if (tzLower.includes('tokyo') || tzLower.includes('japan')) {
      return { code: 'JP', name: 'Japan', flag: '🇯🇵' };
    }
    if (tzLower.includes('singapore')) {
      return { code: 'SG', name: 'Singapore', flag: '🇸🇬' };
    }
    if (tzLower.includes('auckland')) {
      return { code: 'NZ', name: 'New Zealand', flag: '🇳🇿' };
    }
    if (tzLower.includes('sao_paulo') || tzLower.includes('brazil')) {
      return { code: 'BR', name: 'Brazil', flag: '🇧🇷' };
    }
    if (tzLower.includes('mexico')) {
      return { code: 'MX', name: 'Mexico', flag: '🇲🇽' };
    }
    if (tzLower.includes('rome') || tzLower.includes('milan')) {
      return { code: 'IT', name: 'Italy', flag: '🇮🇹' };
    }
    if (tzLower.includes('madrid')) {
      return { code: 'ES', name: 'Spain', flag: '🇪🇸' };
    }
    if (tzLower.includes('amsterdam')) {
      return { code: 'NL', name: 'Netherlands', flag: '🇳🇱' };
    }
    if (tzLower.includes('zurich')) {
      return { code: 'CH', name: 'Switzerland', flag: '🇨🇭' };
    }
    if (tzLower.includes('dublin')) {
      return { code: 'IE', name: 'Ireland', flag: '🇮🇪' };
    }
    if (tzLower.includes('dubai')) {
      return { code: 'AE', name: 'United Arab Emirates', flag: '🇦🇪' };
    }
    if (tzLower.includes('america/') || tzLower.includes('new_york') || tzLower.includes('chicago') || tzLower.includes('los_angeles') || tzLower.includes('us/')) {
      return { code: 'US', name: 'United States', flag: '🇺🇸' };
    }
  } catch {
    // ignore
  }

  // Check language code as fallback (e.g. en-US, en-IN, en-GB)
  if (typeof navigator !== 'undefined' && navigator.language) {
    const parts = navigator.language.split('-');
    if (parts.length > 1) {
      const region = parts[1].toUpperCase();
      const match = SUPPORTED_COUNTRIES.find((c) => c.code === region);
      if (match) return match;
    }
  }

  // Default to US
  return { code: 'US', name: 'United States', flag: '🇺🇸' };
}

export function saveUserCountry(countryCode: string) {
  localStorage.setItem('user_holiday_country', countryCode);
}

// Raw item from Nager.Date Public Holidays API
interface NagerHoliday {
  date: string; // YYYY-MM-DD
  localName: string;
  name: string;
  countryCode: string;
  fixed: boolean;
  global: boolean;
  counties: string[] | null;
  launchYear: number | null;
  types: string[];
}

/**
 * Assign appropriate emoji and styling to API holiday based on keywords
 */
function enrichApiHoliday(
  item: NagerHoliday,
  country: CountryInfo
): HolidayEvent {
  const nameLower = (item.name + ' ' + item.localName).toLowerCase();

  let emoji = country.flag;
  let type: HolidayType = 'national';
  let category = `${country.name} Public Holiday`;

  if (nameLower.includes('new year')) {
    emoji = '🎆';
    type = 'festival';
    category = 'New Year Celebration';
  } else if (nameLower.includes('christmas')) {
    emoji = '🎄';
    type = 'festival';
    category = 'Christmas Observance';
  } else if (nameLower.includes('easter') || nameLower.includes('good friday')) {
    emoji = '🥚';
    type = 'festival';
    category = 'Spring Celebration';
  } else if (nameLower.includes('independence') || nameLower.includes('republic') || nameLower.includes('national day') || nameLower.includes('constitution') || nameLower.includes('bastille')) {
    emoji = country.flag;
    type = 'national';
    category = 'National Celebration';
  } else if (nameLower.includes('thanksgiving')) {
    emoji = '🦃';
    type = 'festival';
    category = 'Harvest & Thanksgiving';
  } else if (nameLower.includes('diwali') || nameLower.includes('deepavali')) {
    emoji = '🪔';
    type = 'festival';
    category = 'Festival of Lights';
  } else if (nameLower.includes('holi')) {
    emoji = '🎨';
    type = 'festival';
    category = 'Festival of Colors';
  } else if (nameLower.includes('eid')) {
    emoji = '🌙';
    type = 'festival';
    category = 'Islamic Festival';
  } else if (nameLower.includes('labor') || nameLower.includes('labour') || nameLower.includes('workers')) {
    emoji = '🛠️';
    type = 'national';
    category = 'Labor Day';
  } else if (nameLower.includes('veterans') || nameLower.includes('memorial') || nameLower.includes('remembrance') || nameLower.includes('anzac')) {
    emoji = '🎖️';
    type = 'observance';
    category = 'Remembrance Day';
  } else if (nameLower.includes('carnival') || nameLower.includes('mardi gras')) {
    emoji = '🎭';
    type = 'festival';
    category = 'Carnival Celebration';
  } else if (nameLower.includes('halloween')) {
    emoji = '🎃';
    type = 'festival';
    category = 'Halloween';
  } else if (nameLower.includes('king') || nameLower.includes('queen') || nameLower.includes('monarch')) {
    emoji = '👑';
    type = 'national';
    category = 'Royal Observance';
  }

  const displayName = item.name === item.localName ? item.name : `${item.name} (${item.localName})`;

  return {
    id: `api-${item.countryCode}-${item.date}-${item.name.toLowerCase().replace(/[^a-z0-9]/g, '-')}`,
    name: displayName,
    date: item.date,
    type,
    emoji,
    categoryName: category,
    description: `Official public holiday in ${country.name}. Recognized government and public observance.`,
    traditions: `Public holiday observance across ${country.name}. Many businesses, schools, and offices observe special hours or closure.`,
    regions: [country.name],
    color: {
      bg: 'bg-emerald-50 dark:bg-emerald-950/40',
      text: 'text-emerald-900 dark:text-emerald-200',
      border: 'border-emerald-200 dark:border-emerald-800/50',
      dot: 'bg-emerald-500',
    },
  };
}

const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

interface CacheEntry {
  timestamp: number;
  data: HolidayEvent[];
}

/**
 * Fetch Public Holidays from Live Public Holidays API (Nager.Date / Calendarific / AbstractAPI compatible)
 */
export async function fetchLivePublicHolidays(
  year: number,
  countryCode: string
): Promise<{ holidays: HolidayEvent[]; fromCache: boolean; isLive: boolean }> {
  const cacheKey = `publicholidays_api_${countryCode}_${year}`;
  const country = SUPPORTED_COUNTRIES.find((c) => c.code === countryCode) || {
    code: countryCode,
    name: countryCode,
    flag: '🌍',
  };

  // Check local storage cache
  try {
    const cached = localStorage.getItem(cacheKey);
    if (cached) {
      const parsed: CacheEntry = JSON.parse(cached);
      if (Date.now() - parsed.timestamp < CACHE_TTL_MS && parsed.data.length > 0) {
        return { holidays: parsed.data, fromCache: true, isLive: true };
      }
    }
  } catch {
    // ignore parse errors
  }

  // Primary live endpoint: Nager.Date Public Holidays API (free, open, no auth key required)
  try {
    const response = await fetch(
      `https://date.nager.at/api/v3/PublicHolidays/${year}/${countryCode}`,
      {
        headers: {
          Accept: 'application/json',
        },
      }
    );

    if (response.ok) {
      const items: NagerHoliday[] = await response.json();
      if (Array.isArray(items)) {
        const enriched = items.map((item) => enrichApiHoliday(item, country));

        // Save to cache
        try {
          const entry: CacheEntry = {
            timestamp: Date.now(),
            data: enriched,
          };
          localStorage.setItem(cacheKey, JSON.stringify(entry));
        } catch {
          // ignore storage quota
        }

        return { holidays: enriched, fromCache: false, isLive: true };
      }
    }
  } catch (err) {
    console.warn('Live public holiday API request failed, checking cache or local dataset:', err);
  }

  // Fallback: Check expired cache if network failed
  try {
    const cached = localStorage.getItem(cacheKey);
    if (cached) {
      const parsed: CacheEntry = JSON.parse(cached);
      if (parsed.data && parsed.data.length > 0) {
        return { holidays: parsed.data, fromCache: true, isLive: true };
      }
    }
  } catch {
    // ignore
  }

  return { holidays: [], fromCache: false, isLive: false };
}

/**
 * Get unified holidays combining Live Public Holidays API and cultural festivals
 */
export async function getUnifiedHolidays(
  year: number,
  countryCode: string
): Promise<{ holidays: HolidayEvent[]; isLiveApi: boolean; lastSynced: Date }> {
  // 1. Static/curated festivals & global holidays
  const curated = getAllHolidaysForYear(year);

  // 2. Fetch live public holidays for user country
  const { holidays: apiHolidays, isLive } = await fetchLivePublicHolidays(year, countryCode);

  // 3. Intelligently merge:
  // If an API holiday has the same date as a curated holiday with similar name, merge details.
  // Otherwise, include both.
  const mergedMap = new Map<string, HolidayEvent>();

  // Insert curated first
  for (const h of curated) {
    const key = `${h.date}_${h.name.toLowerCase().slice(0, 8)}`;
    mergedMap.set(key, h);
  }

  // Overlay API holidays
  for (const apiH of apiHolidays) {
    const baseName = apiH.name.toLowerCase().split('(')[0].trim().slice(0, 8);
    const key = `${apiH.date}_${baseName}`;

    if (mergedMap.has(key)) {
      // Enhance existing curated with official public holiday tag
      const existing = mergedMap.get(key)!;
      mergedMap.set(key, {
        ...existing,
        regions: Array.from(new Set([...(existing.regions || []), ...(apiH.regions || [])])),
        categoryName: existing.categoryName.includes('Public')
          ? existing.categoryName
          : `${existing.categoryName} • Public Holiday`,
      });
    } else {
      // Add new country-specific public holiday
      mergedMap.set(`${apiH.date}_api_${apiH.id}`, apiH);
    }
  }

  const allMerged = Array.from(mergedMap.values()).sort((a, b) => a.date.localeCompare(b.date));

  return {
    holidays: allMerged,
    isLiveApi: isLive,
    lastSynced: new Date(),
  };
}

/**
 * Get upcoming unified holidays from a starting date
 */
export function filterUpcoming(
  holidays: HolidayEvent[],
  fromDateStr: string,
  limit = 8
): HolidayEvent[] {
  return holidays
    .filter((h) => h.date >= fromDateStr)
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(0, limit);
}

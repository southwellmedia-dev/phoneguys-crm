import { StoreSettingsRepository } from '@/lib/repositories/settings.repository';
import { StoreSettings } from '@/lib/types/database.types';

export class StoreSettingsService {
  private repository: StoreSettingsRepository;
  private static cachedSettings: StoreSettings | null = null;
  private static cacheTime: number = 0;
  private static CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

  constructor() {
    this.repository = new StoreSettingsRepository(true);
  }

  async getSettings(): Promise<StoreSettings> {
    // Return cached settings if still valid
    const now = Date.now();
    if (StoreSettingsService.cachedSettings && 
        (now - StoreSettingsService.cacheTime) < StoreSettingsService.CACHE_DURATION) {
      return StoreSettingsService.cachedSettings;
    }

    // Fetch fresh settings
    const settings = await this.repository.get();
    
    // Return default values if no settings exist
    if (!settings) {
      return this.getDefaultSettings();
    }

    // Cache the settings
    StoreSettingsService.cachedSettings = settings;
    StoreSettingsService.cacheTime = now;
    
    return settings;
  }

  getDefaultSettings(): StoreSettings {
    return {
      id: '',
      store_name: 'The Phone Guys',
      store_email: 'info@phoneguys.com',
      store_phone: '(469) 608-1050',
      store_address: '5619 E Grand Ave #110',
      store_city: 'Dallas',
      store_state: 'TX',
      store_zip: '75223',
      store_country: 'USA',
      store_website: 'https://phoneguysrepair.com',
      store_description: null,
      tax_rate: 8.25,
      currency: 'USD',
      timezone: 'America/Chicago',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      website_integration_enabled: true,
      allowed_form_origins: [],
      form_submission_email: null,
      auto_create_appointments: true,
      require_api_key: true
    } as StoreSettings;
  }

  formatAddress(settings: StoreSettings): string {
    return `${settings.store_address}, ${settings.store_city}, ${settings.store_state} ${settings.store_zip}`;
  }

  formatContactInfo(settings: StoreSettings): string {
    return `Phone: ${settings.store_phone} | Email: ${settings.store_email}`;
  }

  // Clear cache when settings are updated
  static clearCache() {
    StoreSettingsService.cachedSettings = null;
    StoreSettingsService.cacheTime = 0;
  }
}
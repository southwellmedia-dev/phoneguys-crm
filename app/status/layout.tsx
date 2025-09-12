import { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';

export const metadata: Metadata = {
  title: 'Status Check | The Phone Guys',
  description: 'Check the status of your repair or appointment',
};

export default async function StatusLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Fetch store settings
  const supabase = await createClient();
  const { data: settings } = await supabase
    .from('store_settings')
    .select('store_name, store_phone, store_address, store_city, store_state, store_zip, store_website')
    .single();

  const storeName = settings?.store_name || 'The Phone Guys';
  const storePhone = settings?.store_phone || '(469) 608-1050';
  const storeAddress = settings ? 
    `${settings.store_address}, ${settings.store_city}, ${settings.store_state} ${settings.store_zip}` : 
    '5619 E Grand Ave #110, Dallas, TX 75223';

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="container mx-auto px-4 py-8">
        {/* Main Content - No header */}
        <main className="max-w-5xl mx-auto">
          {children}
        </main>
        
        {/* Footer */}
        <footer className="mt-16 text-center text-sm text-gray-500">
          <p>© {new Date().getFullYear()} {storeName}. All rights reserved.</p>
          <p className="mt-2">
            Need help? Call us at{' '}
            <a href={`tel:${storePhone.replace(/\D/g, '')}`} className="text-cyan-600 hover:text-cyan-700 font-medium">
              {storePhone}
            </a>
          </p>
          <p className="mt-1 text-xs">
            {storeAddress}
          </p>
        </footer>
      </div>
    </div>
  );
}
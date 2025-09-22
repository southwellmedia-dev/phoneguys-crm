'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { toast } from 'sonner';
import { Loader2, Image, Download, CheckCircle, XCircle, AlertCircle } from 'lucide-react';

interface ImageStats {
  total: number;
  withImages: number;
  withoutImages: number;
  percentageComplete: number;
  byManufacturer: Record<string, { total: number; withImages: number }>;
}

export default function DeviceImagesPage() {
  const [loading, setLoading] = useState(false);
  const [populating, setPopulating] = useState(false);
  const [stats, setStats] = useState<ImageStats | null>(null);
  const [progress, setProgress] = useState({ current: 0, total: 0, device: '' });

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/admin/devices/populate-images');
      const data = await response.json();
      if (data.success) {
        setStats(data.stats);
      } else {
        toast.error('Failed to fetch image statistics');
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
      toast.error('Failed to fetch image statistics');
    } finally {
      setLoading(false);
    }
  };

  const populateImages = async (limit: number = 10) => {
    setPopulating(true);
    setProgress({ current: 0, total: limit, device: 'Starting...' });
    
    try {
      const response = await fetch('/api/admin/devices/populate-images', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ limit })
      });
      
      const data = await response.json();
      
      if (data.success) {
        toast.success(data.message);
        // Refresh stats
        await fetchStats();
      } else {
        toast.error(data.message || 'Failed to populate images');
      }
    } catch (error) {
      console.error('Error populating images:', error);
      toast.error('Failed to populate images');
    } finally {
      setPopulating(false);
      setProgress({ current: 0, total: 0, device: '' });
    }
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Device Image Management</h1>
          <p className="text-muted-foreground mt-1">
            Automatically populate device images from official sources
          </p>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      ) : stats ? (
        <>
          {/* Overall Statistics */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Image className="h-5 w-5" />
                Image Coverage Statistics
              </CardTitle>
              <CardDescription>
                {stats.withImages} of {stats.total} devices have images
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Overall Progress</span>
                  <span className="font-medium">{stats.percentageComplete}%</span>
                </div>
                <Progress value={stats.percentageComplete} className="h-2" />
              </div>

              <div className="grid grid-cols-3 gap-4 pt-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">{stats.withImages}</div>
                  <div className="text-sm text-muted-foreground">With Images</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-red-600">{stats.withoutImages}</div>
                  <div className="text-sm text-muted-foreground">Without Images</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold">{stats.total}</div>
                  <div className="text-sm text-muted-foreground">Total Devices</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Manufacturer Breakdown */}
          <Card>
            <CardHeader>
              <CardTitle>By Manufacturer</CardTitle>
              <CardDescription>
                Image coverage breakdown by device manufacturer
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {Object.entries(stats.byManufacturer).map(([manufacturer, data]) => (
                  <div key={manufacturer} className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">{manufacturer}</span>
                      <span className="text-sm text-muted-foreground">
                        {data.withImages}/{data.total} ({Math.round((data.withImages / data.total) * 100)}%)
                      </span>
                    </div>
                    <Progress 
                      value={(data.withImages / data.total) * 100} 
                      className="h-1.5"
                    />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Populate Missing Images</CardTitle>
              <CardDescription>
                Automatically fetch and store device images from official sources
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-muted p-4 rounded-lg space-y-2">
                <div className="flex items-start gap-2">
                  <AlertCircle className="h-5 w-5 text-blue-500 mt-0.5" />
                  <div className="text-sm space-y-1">
                    <p className="font-medium">How it works:</p>
                    <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                      <li>Fetches official images from Apple, manufacturers, and device databases</li>
                      <li>Downloads and stores images in Supabase Storage for fast loading</li>
                      <li>Updates device records with permanent image URLs</li>
                      <li>Falls back to high-quality placeholders if no official image found</li>
                    </ul>
                  </div>
                </div>
              </div>

              {populating && progress.total > 0 && (
                <div className="space-y-2 p-4 border rounded-lg">
                  <div className="flex justify-between text-sm">
                    <span>Processing: {progress.device}</span>
                    <span>{progress.current}/{progress.total}</span>
                  </div>
                  <Progress 
                    value={(progress.current / progress.total) * 100} 
                    className="h-2"
                  />
                </div>
              )}

              <div className="flex gap-3">
                <Button 
                  onClick={() => populateImages(10)}
                  disabled={populating || stats.withoutImages === 0}
                  className="flex items-center gap-2"
                >
                  {populating ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Populating...
                    </>
                  ) : (
                    <>
                      <Download className="h-4 w-4" />
                      Populate 10 Devices
                    </>
                  )}
                </Button>

                <Button 
                  onClick={() => populateImages(50)}
                  disabled={populating || stats.withoutImages === 0}
                  variant="outline"
                  className="flex items-center gap-2"
                >
                  <Download className="h-4 w-4" />
                  Populate 50 Devices
                </Button>

                {stats.withoutImages > 0 && (
                  <Button 
                    onClick={() => populateImages(stats.withoutImages)}
                    disabled={populating}
                    variant="outline"
                    className="flex items-center gap-2"
                  >
                    <Download className="h-4 w-4" />
                    Populate All ({stats.withoutImages})
                  </Button>
                )}

                <Button 
                  onClick={fetchStats}
                  disabled={loading || populating}
                  variant="ghost"
                  className="ml-auto"
                >
                  Refresh Stats
                </Button>
              </div>

              {stats.withoutImages === 0 && (
                <div className="flex items-center gap-2 text-green-600 p-4 bg-green-50 rounded-lg">
                  <CheckCircle className="h-5 w-5" />
                  <span className="font-medium">All devices have images!</span>
                </div>
              )}
            </CardContent>
          </Card>
        </>
      ) : (
        <Card>
          <CardContent className="py-12">
            <div className="flex items-center justify-center text-muted-foreground">
              No statistics available
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
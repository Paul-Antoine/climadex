import gdal from 'gdal-async';

const wgs84 = gdal.SpatialReference.fromEPSG(4326);

export const TIMEFRAMES = ['2030', '2050', '2070', '2090'] as const;
export type TimeFrame = (typeof TIMEFRAMES)[number];

export const getMeanTemperatureWarmestQuarter = ({
  latitude,
  longitude,
  timeframe,
}: {
  latitude: number;
  longitude: number;
  timeframe: TimeFrame;
}): number | null => {
  const dataset = gdal.open(`../assets/${timeframe}.tif`);
  const xform = new gdal.CoordinateTransformation(wgs84, dataset);

  const coords = xform.transformPoint(longitude, latitude);
  const x = Math.floor(coords.x);
  const y = Math.floor(coords.y);

  const band = dataset.bands.get(1);

  const value = +band.pixels.get(x, y);

  if (value < -10000 || isNaN(value)) {
    return null;
  }

  return Math.round(value * 100) / 100;
};

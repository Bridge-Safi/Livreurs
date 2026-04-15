import type { Delivery, Deliverer, Driver, Trip } from "@workspace/db";

function serializeDate(d: Date | string | null | undefined): string | undefined {
  if (!d) return undefined;
  if (d instanceof Date) return d.toISOString();
  return String(d);
}

function requiredDate(d: Date | string): string {
  if (d instanceof Date) return d.toISOString();
  return String(d);
}

export function serializeDelivery(d: Delivery) {
  return {
    id: d.id,
    trackingNumber: d.trackingNumber,
    customerName: d.customerName,
    customerPhone: d.customerPhone ?? undefined,
    pickupAddress: d.pickupAddress,
    deliveryAddress: d.deliveryAddress,
    status: d.status,
    priority: d.priority,
    weight: d.weight ?? undefined,
    notes: d.notes ?? undefined,
    delivererId: d.delivererId ?? undefined,
    estimatedDeliveryTime: d.estimatedDeliveryTime ?? undefined,
    createdAt: requiredDate(d.createdAt),
    updatedAt: serializeDate(d.updatedAt),
  };
}

export function serializeDeliverer(d: Deliverer) {
  return {
    id: d.id,
    name: d.name,
    phone: d.phone,
    email: d.email ?? undefined,
    vehicleType: d.vehicleType,
    status: d.status,
    zone: d.zone ?? undefined,
    totalDeliveries: d.totalDeliveries,
    rating: d.rating,
    averageDeliveryTime: d.averageDeliveryTime,
    createdAt: requiredDate(d.createdAt),
  };
}

export function serializeDriver(d: Driver) {
  return {
    id: d.id,
    name: d.name,
    phone: d.phone,
    email: d.email ?? undefined,
    licenseNumber: d.licenseNumber,
    vehicleModel: d.vehicleModel,
    vehiclePlate: d.vehiclePlate,
    status: d.status,
    totalTrips: d.totalTrips,
    rating: d.rating,
    createdAt: requiredDate(d.createdAt),
  };
}

export function serializeTrip(t: Trip) {
  return {
    id: t.id,
    passengerName: t.passengerName,
    passengerPhone: t.passengerPhone ?? undefined,
    pickupAddress: t.pickupAddress,
    dropoffAddress: t.dropoffAddress,
    status: t.status,
    fare: t.fare,
    distance: t.distance ?? undefined,
    duration: t.duration ?? undefined,
    driverId: t.driverId ?? undefined,
    scheduledAt: t.scheduledAt ?? undefined,
    startedAt: t.startedAt ?? undefined,
    completedAt: t.completedAt ?? undefined,
    createdAt: requiredDate(t.createdAt),
  };
}

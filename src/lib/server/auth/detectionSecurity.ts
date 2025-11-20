/**
 * Security helper functions for ProductDetection
 * Ensures all queries are scoped to the current user
 */

import { EntityManager } from "@mikro-orm/core";
import { ProductDetection } from "@/lib/server/entities/ProductDetection";
import { getCurrentUserId } from "./getSession";

/**
 * Verifies that a user is authenticated and returns their userId
 * Throws an error if not authenticated
 */
export async function requireAuth(request: Request): Promise<string> {
  const userId = await getCurrentUserId(request);
  
  if (!userId) {
    throw new Error('Authentication required');
  }
  
  return userId;
}

/**
 * Finds a detection by UUID, ensuring it belongs to the specified user
 * Returns null if not found or doesn't belong to user
 */
export async function findUserDetection(
  em: EntityManager,
  uuid: string,
  userId: string
): Promise<ProductDetection | null> {
  return await em.findOne(ProductDetection, {
    uuid: uuid,
    userId: userId
  });
}

/**
 * Finds all detections for a specific user
 */
export async function findUserDetections(
  em: EntityManager,
  userId: string,
  options?: {
    limit?: number;
    orderBy?: { createdAt?: 'ASC' | 'DESC' };
  }
): Promise<ProductDetection[]> {
  return await em.find(
    ProductDetection,
    { userId: userId },
    {
      orderBy: options?.orderBy || { createdAt: 'DESC' },
      limit: options?.limit || 100
    }
  );
}


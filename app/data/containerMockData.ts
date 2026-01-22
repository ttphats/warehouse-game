/**
 * Mock data for Container Management System
 * Designed to be easily replaced with database queries
 */

import { YardContainer } from '../types/container.types';

/**
 * Mock containers - Empty array để bắt đầu clean
 * Containers sẽ được spawn tự động từ ASN list khi user click "Thêm Container"
 *
 * Trong production: Replace với database query
 * SELECT * FROM containers WHERE state IN ('in_yard', 'arriving')
 */
export const MOCK_CONTAINERS: YardContainer[] = [];


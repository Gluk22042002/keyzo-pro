import { jest } from '@jest/globals';

process.env.JWT_SECRET = 'test-jwt-secret-key-for-testing-only';
process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/keyzo_test';
process.env.NODE_ENV = 'test';
process.env.PORT = '0';

const mockQuery = jest.fn();
const mockGet = jest.fn();
const mockGetAll = jest.fn();
const mockRun = jest.fn();
const mockTransaction = jest.fn();

jest.unstable_mockModule('../db.js', () => ({
  query: mockQuery,
  get: mockGet,
  getAll: mockGetAll,
  run: mockRun,
  transaction: mockTransaction,
  default: { query: mockQuery, connect: jest.fn() },
}));

globalThis.__mocks = {
  query: mockQuery,
  get: mockGet,
  getAll: mockGetAll,
  run: mockRun,
  transaction: mockTransaction,
};

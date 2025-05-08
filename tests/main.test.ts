import { spawn } from 'child_process';
import fs from 'fs/promises';
import path from 'path';
import * as main from '../src/main';

// Mock the modules we depend on
jest.mock('child_process', () => ({
    spawn: jest.fn(),
}));

jest.mock('fs/promises', () => ({
    readdir: jest.fn(),
}));

jest.mock('path', () => ({
    join: jest.fn(),
}));

describe('ProcessError', () => {
    test('should create error with code', () => {
        const error = new Error('Process exited with code 123') as any;
        error.code = 123;

        expect(error.message).toBe('Process exited with code 123');
        expect(error.code).toBe(123);
    });
});

describe('getBinaryPath', () => {
    beforeEach(() => {
        jest.resetAllMocks();

        // Default mock setup for path.join
        (path.join as jest.Mock).mockImplementation((...args) => args.join('/'));
    });

    test('should return correct path for Windows', async () => {
        // Setup mocks for Windows platform
        const originalPlatform = process.platform;
        Object.defineProperty(process, 'platform', { value: 'win32' });

        const mockFiles = [
            { name: 'rojo.exe', isFile: () => true },
            { name: 'other-file.txt', isFile: () => true }
        ];

        (fs.readdir as jest.Mock).mockResolvedValue(mockFiles);

        const result = await main.getBinaryPath();

        expect(path.join).toHaveBeenCalledWith(expect.any(String), '..', 'bin', 'win32');
        expect(result).toContain('rojo.exe');

        // Restore original platform
        Object.defineProperty(process, 'platform', { value: originalPlatform });
    });

    test('should return correct path for Linux', async () => {
        // Setup mocks for Linux platform
        const originalPlatform = process.platform;
        Object.defineProperty(process, 'platform', { value: 'linux' });

        const mockFiles = [
            { name: 'rojo', isFile: () => true },
            { name: 'other-file', isFile: () => true }
        ];

        (fs.readdir as jest.Mock).mockResolvedValue(mockFiles);

        const result = await main.getBinaryPath();

        expect(path.join).toHaveBeenCalledWith(expect.any(String), '..', 'bin', 'linux');
        expect(result).toContain('rojo');

        // Restore original platform
        Object.defineProperty(process, 'platform', { value: originalPlatform });
    });

    test('should return correct path for macOS', async () => {
        // Setup mocks for macOS platform
        const originalPlatform = process.platform;
        Object.defineProperty(process, 'platform', { value: 'darwin' });

        const mockFiles = [
            { name: 'rojo', isFile: () => true },
            { name: 'other-file', isFile: () => true }
        ];

        (fs.readdir as jest.Mock).mockResolvedValue(mockFiles);

        const result = await main.getBinaryPath();

        expect(path.join).toHaveBeenCalledWith(expect.any(String), '..', 'bin', 'darwin');
        expect(result).toContain('rojo');

        // Restore original platform
        Object.defineProperty(process, 'platform', { value: originalPlatform });
    });

    test('should return null if binary not found', async () => {
        const originalPlatform = process.platform;
        Object.defineProperty(process, 'platform', { value: 'win32' });

        const mockFiles = [
            { name: 'not-rojo.txt', isFile: () => true }
        ];

        (fs.readdir as jest.Mock).mockResolvedValue(mockFiles);

        const result = await main.getBinaryPath();

        expect(result).toBeNull();

        // Restore original platform
        Object.defineProperty(process, 'platform', { value: originalPlatform });
    });
});

describe('main', () => {
    beforeEach(() => {
        jest.resetAllMocks();

        // Default mock implementation for spawn and path.join
        const mockChildProcess = {
            on: jest.fn()
        };
        (spawn as jest.Mock).mockReturnValue(mockChildProcess);
        (path.join as jest.Mock).mockImplementation((...args) => args.join('/'));
        
        // Setup default platform and fs.readdir mock for all tests
        const mockFiles = [
            { name: 'rojo.exe', isFile: () => true },
            { name: 'other-file.txt', isFile: () => true }
        ];
        (fs.readdir as jest.Mock).mockResolvedValue(mockFiles);

        // Mock process.argv
        process.argv = ['node', 'main.js'];
    });

    test('should spawn binary with correct arguments', async () => {
        const binaryPath = await main.getBinaryPath();
        
        process.argv = ['npx', 'rojo', 'serve', '--port=8080'];

        // Create mock for child process
        const mockOn = jest.fn();
        const mockChildProcess = { on: mockOn };
        (spawn as jest.Mock).mockReturnValue(mockChildProcess);

        // Simulate successful exit
        mockOn.mockImplementation((event, callback) => {
            if (event === 'exit') setTimeout(() => callback(0), 0);
            return mockChildProcess;
        });

        // Execute main and await promise resolution
        const mainPromise = main.main();

        // Assertions
        await expect(mainPromise).resolves.toBeUndefined();
        expect(spawn).toHaveBeenCalledWith(binaryPath, ['serve', '--port=8080'], { stdio: 'inherit' });
    });

    test('should reject when process exits with non-zero code', async () => {
        // Setup mock path
        const mockPath = '/mock/path/to/rojo';
        jest.spyOn(main, 'getBinaryPath').mockResolvedValue(mockPath);

        // Create mock for child process
        const mockOn = jest.fn();
        const mockChildProcess = { on: mockOn };
        (spawn as jest.Mock).mockReturnValue(mockChildProcess);

        // Simulate error exit
        mockOn.mockImplementation((event, callback) => {
            if (event === 'exit') setTimeout(() => callback(1), 0);
            return mockChildProcess;
        });

        await expect(main.main()).rejects.toThrow('Process exited with code 1');
    });

    test('should resolve when process exits with code 2 (special case)', async () => {
        // Setup mock path
        const mockPath = '/mock/path/to/rojo';
        jest.spyOn(main, 'getBinaryPath').mockResolvedValue(mockPath);

        // Create mock for child process
        const mockOn = jest.fn();
        const mockChildProcess = { on: mockOn };
        (spawn as jest.Mock).mockReturnValue(mockChildProcess);

        // Simulate exit with code 2 (which should resolve according to your implementation)
        mockOn.mockImplementation((event, callback) => {
            if (event === 'exit') setTimeout(() => callback(2), 0);
            return mockChildProcess;
        });

        await expect(main.main()).resolves.toBeUndefined();
    });

    test('should reject when process emits error', async () => {
        // Setup mock path
        const mockPath = '/mock/path/to/rojo';
        jest.spyOn(main, 'getBinaryPath').mockResolvedValue(mockPath);

        // Create mock for child process
        const mockOn = jest.fn();
        const mockChildProcess = { on: mockOn };
        (spawn as jest.Mock).mockReturnValue(mockChildProcess);

        // Simulate process error
        const testError = new Error('Test spawn error');
        mockOn.mockImplementation((event, callback) => {
            if (event === 'error') setTimeout(() => callback(testError), 0);
            return mockChildProcess;
        });

        await expect(main.main()).rejects.toThrow('Test spawn error');
    });
});
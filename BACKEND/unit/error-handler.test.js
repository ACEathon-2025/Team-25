const { errorHandler, AppError } = require('../../utils/error-handler');

describe('Error Handler', () => {
  describe('AppError Class', () => {
    test('should create operational error with correct properties', () => {
      const error = new AppError('Test error', 400, 'TEST_ERROR');
      
      expect(error.message).toBe('Test error');
      expect(error.statusCode).toBe(400);
      expect(error.errorCode).toBe('TEST_ERROR');
      expect(error.isOperational).toBe(true);
      expect(error.stack).toBeDefined();
    });
  });

  describe('catchAsync', () => {
    test('should catch async errors and pass to next', async () => {
      const mockReq = {};
      const mockRes = {};
      const mockNext = jest.fn();
      
      const asyncFn = errorHandler.catchAsync(async (req, res, next) => {
        throw new Error('Async error');
      });
      
      await asyncFn(mockReq, mockRes, mockNext);
      
      expect(mockNext).toHaveBeenCalledWith(expect.any(Error));
    });

    test('should not call next when no error occurs', async () => {
      const mockReq = {};
      const mockRes = { json: jest.fn() };
      const mockNext = jest.fn();
      
      const asyncFn = errorHandler.catchAsync(async (req, res, next) => {
        res.json({ success: true });
      });
      
      await asyncFn(mockReq, mockRes, mockNext);
      
      expect(mockNext).not.toHaveBeenCalled();
      expect(mockRes.json).toHaveBeenCalledWith({ success: true });
    });
  });

  describe('createError helpers', () => {
    test('should create not found error', () => {
      const error = errorHandler.createError.notFound('User not found');
      
      expect(error).toBeInstanceOf(AppError);
      expect(error.statusCode).toBe(404);
      expect(error.errorCode).toBe('NOT_FOUND');
    });

    test('should create bad request error', () => {
      const error = errorHandler.createError.badRequest();
      
      expect(error.statusCode).toBe(400);
      expect(error.errorCode).toBe('BAD_REQUEST');
    });

    test('should create unauthorized error', () => {
      const error = errorHandler.createError.unauthorized();
      
      expect(error.statusCode).toBe(401);
      expect(error.errorCode).toBe('UNAUTHORIZED');
    });
  });

  describe('logError', () => {
    beforeEach(() => {
      jest.spyOn(console, 'error').mockImplementation();
    });

    afterEach(() => {
      console.error.mockRestore();
    });

    test('should log error with context', () => {
      const error = new Error('Test error');
      const context = { userId: '123', action: 'test' };
      
      errorHandler.logError(error, context);
      
      expect(console.error).toHaveBeenCalledWith(
        'Application Error:',
        expect.stringContaining('Test error')
      );
    });
  });
});

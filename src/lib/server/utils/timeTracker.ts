/**
 * Time Tracking Utility
 * Matches Python backend TimeTracker functionality
 */

export class TimeTracker {
  private startTime: number;
  private endTime: number | null = null;
  private stageName: string;
  private verbose: boolean;

  constructor(stageName: string, verbose: boolean = true) {
    this.stageName = stageName;
    this.verbose = verbose;
    this.startTime = Date.now();
  }

  /**
   * Start tracking time (called automatically in constructor)
   */
  start(): void {
    this.startTime = Date.now();
    if (this.verbose) {
      console.log(`\n⏳ ${this.stageName} starting...`);
    }
  }

  /**
   * Stop tracking and return elapsed time
   */
  stop(): number {
    this.endTime = Date.now();
    const elapsed = this.getElapsed();
    
    if (this.verbose) {
      console.log(`✅ ${this.stageName} completed in ${elapsed.toFixed(2)}s`);
    }
    
    return elapsed;
  }

  /**
   * Stop with error
   */
  stopWithError(error: Error): number {
    this.endTime = Date.now();
    const elapsed = this.getElapsed();
    
    if (this.verbose) {
      console.log(`❌ ${this.stageName} failed after ${elapsed.toFixed(2)}s`);
    }
    
    return elapsed;
  }

  /**
   * Get elapsed time in seconds
   */
  getElapsed(): number {
    const end = this.endTime || Date.now();
    return (end - this.startTime) / 1000;
  }

  /**
   * Get elapsed time in milliseconds
   */
  getElapsedMs(): number {
    const end = this.endTime || Date.now();
    return end - this.startTime;
  }
}

/**
 * Helper function to wrap async operations with time tracking
 */
export async function trackTime<T>(
  stageName: string,
  operation: () => Promise<T>,
  verbose: boolean = true
): Promise<{ result: T; executionTime: number }> {
  const tracker = new TimeTracker(stageName, verbose);
  tracker.start();
  
  try {
    const result = await operation();
    const executionTime = tracker.stop();
    return { result, executionTime };
  } catch (error) {
    const executionTime = tracker.stopWithError(error as Error);
    throw error;
  }
}

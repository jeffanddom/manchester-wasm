export class DebouncedBuilder {
  private buildFunc: () => Promise<void>
  private debounce: boolean
  private period: number
  private building: boolean
  private buildQueued: boolean

  constructor(buildFunc: () => Promise<void>, period: number = 1000) {
    this.buildFunc = buildFunc
    this.debounce = false
    this.period = period
    this.building = false
    this.buildQueued = false
  }

  touch(): void {
    if (this.debounce) {
      return
    }

    this.debounce = true

    setTimeout(() => {
      this.debounce = false
      this.rebuild()
    }, this.period)
  }

  async rebuild(): Promise<void> {
    if (this.building) {
      this.buildQueued = true
      return
    }

    this.building = true
    await this.buildFunc()
    this.building = false

    if (this.buildQueued) {
      this.buildQueued = false;
      this.rebuild();
    }
  }
}

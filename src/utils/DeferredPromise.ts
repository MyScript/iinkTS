
export class DeferredPromise<T> {
  promise: Promise<T>
  resolve!: (value: T) => void
  reject!: (value: Error) => void

  isFullFilled: boolean
  isPending: boolean


  constructor()
  {
    this.isFullFilled = false
    this.isPending = true

    this.promise = new Promise((resolve, reject) =>
    {
      this.reject = async (v: unknown) =>
      {
        this.isFullFilled = true
        this.isPending = false
        return reject(v)
      }
      this.resolve = async (v: unknown) =>
      {
        this.isFullFilled = true
        this.isPending = false
        return resolve(v as T)
      }
    })
  }
}

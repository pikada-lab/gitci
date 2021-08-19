export const timeout = (time: number) => {
    return new Promise((r, x) => {
        setTimeout(r, time);
    })
}
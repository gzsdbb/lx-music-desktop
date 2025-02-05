import { httpFetch } from '../../request'
import { decodeName } from '../../index'

export default {
  formatTime(time) {
    let m = parseInt(time / 60)
    let s = (time % 60).toFixed(2)
    return (m < 10 ? '0' + m : m) + ':' + (s < 10 ? '0' + s : s)
  },
  sortLrcArr(arr) {
    const lrcSet = new Set()
    let lrc = []
    let lrcT = []

    for (const item of arr) {
      if (lrcSet.has(item.time)) {
        const tItem = lrc.pop()
        tItem.time = lrc[lrc.length - 1].time
        lrcT.push(tItem)
        lrc.push(item)
      } else {
        lrc.push(item)
        lrcSet.add(item.time)
      }
    }

    if (lrcT.length && lrc.length > lrcT.length) {
      const tItem = lrc.pop()
      tItem.time = lrc[lrc.length - 1].time
      lrcT.push(tItem)
    }

    return {
      lrc,
      lrcT,
    }
  },
  transformLrc(songinfo, lrclist) {
    return `[ti:${songinfo.songName}]\n[ar:${songinfo.artist}]\n[al:${songinfo.album}]\n[by:]\n[offset:0]\n${lrclist ? lrclist.map(l => `[${this.formatTime(l.time)}]${l.lineLyric}\n`).join('') : '暂无歌词'}`
  },
  getLyric(songId) {
    const requestObj = httpFetch(`http://m.kuwo.cn/newh5/singles/songinfoandlrc?musicId=${songId}`)
    requestObj.promise = requestObj.promise.then(({ body }) => {
      // console.log(body)
      if (!body.data?.lrclist?.length) return Promise.reject(new Error('Get lyric failed'))
      let lrcInfo
      try {
        lrcInfo = this.sortLrcArr(body.data.lrclist)
      } catch {
        return Promise.reject(new Error('Get lyric failed'))
      }
      // console.log(body.data.lrclist)
      // console.log(lrcInfo.lrc, lrcInfo.lrcT)
      // console.log({
      //   lyric: decodeName(this.transformLrc(body.data.songinfo, lrc)),
      //   tlyric: decodeName(this.transformLrc(body.data.songinfo, lrcT)),
      // })
      return {
        lyric: decodeName(this.transformLrc(body.data.songinfo, lrcInfo.lrc)),
        tlyric: lrcInfo.lrcT.length ? decodeName(this.transformLrc(body.data.songinfo, lrcInfo.lrcT)) : '',
      }
    })
    return requestObj
  },
}


/* export default {
  lrcInfoRxp: /<lyric>(.+?)<\/lyric>[\s\S]+<lyric_zz>(.+?)<\/lyric_zz>/,
  parseLyricInfo(str) {
    let result = str.match(this.lrcInfoRxp)
    return result ? { lyric: result[1], lyric_zz: result[2] } : null
  },
  getLyric(songId, isGetLyricx = false) {
    const requestObj = httpFetch(`http://player.kuwo.cn/webmusic/st/getNewMuiseByRid?rid=MUSIC_${songId}`)
    requestObj.promise = requestObj.promise.then(({ statusCode, body }) => {
      console.log(body)
      if (statusCode != 200) return Promise.reject(new Error(JSON.stringify(body)))
      let info = this.parseLyricInfo(body)
      if (!info) return Promise.reject(new Error(JSON.stringify(body)))
      Object.assign(requestObj, httpFetch(`http://newlyric.kuwo.cn/newlyric.lrc?${isGetLyricx ? info.lyric_zz : info.lyric}`))
      return requestObj.promise.then(({ statusCode, body, raw }) => {
        if (statusCode != 200) return Promise.reject(new Error(JSON.stringify(body)))
        return decodeLyric({ lrcBase64: raw.toString('base64'), isGetLyricx }).then(base64Data => {
          return {
            lyric: Buffer.from(base64Data, 'base64').toString(),
            tlyric: '',
          }
        })
      })
    })
    return requestObj
  },
}
 */

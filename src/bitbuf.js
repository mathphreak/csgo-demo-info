// Understanding is hard.
// Adapting blindly is easy.
// from demofilebitbuf.(h|cpp) in Valve's demoinfogo

const bitbuf = {
  kMaxVarint32Bytes: 5
}

const s_nMaskTable = [
  0,
  (1 << 1) - 1,
  (1 << 2) - 1,
  (1 << 3) - 1,
  (1 << 4) - 1,
  (1 << 5) - 1,
  (1 << 6) - 1,
  (1 << 7) - 1,
  (1 << 8) - 1,
  (1 << 9) - 1,
  (1 << 10) - 1,
  (1 << 11) - 1,
  (1 << 12) - 1,
  (1 << 13) - 1,
  (1 << 14) - 1,
  (1 << 15) - 1,
  (1 << 16) - 1,
  (1 << 17) - 1,
  (1 << 18) - 1,
  (1 << 19) - 1,
  (1 << 20) - 1,
  (1 << 21) - 1,
  (1 << 22) - 1,
  (1 << 23) - 1,
  (1 << 24) - 1,
  (1 << 25) - 1,
  (1 << 26) - 1,
  (1 << 27) - 1,
  (1 << 28) - 1,
  (1 << 29) - 1,
  (1 << 30) - 1,
  0x7fffffff,
  0xffffffff
]

class CBitRead {
  constructor (buf) {
    this.m_bOverflow = false
    this.m_nDataBits = -1
    this.m_nDataBytes = 0
    this.StartReading(buf, buf.length)
  }

  get m_pData () {
    throw new Error('That\'s not how it works, you fool')
  }
  get m_pDataIn () {
    throw new Error('That\'s not how it works, you fool')
  }
  set m_pData (x) {
    throw new Error('That\'s not how it works, you fool')
  }
  set m_pDataIn (x) {
    throw new Error('That\'s not how it works, you fool')
  }

  SetOverflowFlag () {
    this.m_bOverflow = true
  }
  IsOverflowed () {
    return this.m_bOverflow
  }
  Tell () {
    return this.GetNumBitsRead()
  }
  TotalBytesAvailable () {
    return this.m_nDataBytes
  }
  GetNumBitsLeft () {
    return this.m_nDataBits - this.Tell()
  }
  GetNumBytesLeft () {
    return this.GetNumBitsLeft() >> 3
  }
  Seek (nPosition) {
    var bSucc = true
    if (nPosition < 0 || nPosition > this.m_nDataBits) {
      this.SetOverflowFlag()
      bSucc = false
      nPosition = this.m_nDataBits
    }
    var nHead = this.m_nDataBytes & 3							// non-multiple-of-4 bytes at head of buffer. We put the "round off"
                                                  // at the head to make reading and detecting the end efficient.

    var nByteOfs = nPosition / 8
    if ((this.m_nDataBytes < 4) || (nHead && (nByteOfs < nHead))) {
      // partial first dword
      var pPartial = 0 // (unsigned char const *)
      if (this.m_data.length > 0) {
        this.m_nInBufWord = this.m_data[pPartial]
        pPartial = 1
        if (nHead > 1) {
          this.m_nInBufWord |= this.m_data[pPartial] << 8 // (*pPartial++)  << 8
          pPartial = 2
        }
        if (nHead > 2) {
          this.m_nInBufWord |= this.m_data[pPartial] << 16 // (*pPartial++) << 16
          pPartial = 3
        }
      }
      this.m_dataIn = this.m_data.slice(pPartial)
      this.m_nInBufWord >>= (nPosition & 31)
      this.m_nBitsAvail = (nHead << 3) - (nPosition & 31)
    } else {
      var nAdjPosition = nPosition - (nHead << 3)
      if (nAdjPosition !== 0 || nHead !== 0) {
        // TODO figure out if this works at all
        this.m_dataIn = this.m_data.slice(((nAdjPosition / 32) << 2) + nHead)
      } else {
        this.m_dataIn = this.m_data.slice(0)
      }
      if (this.m_data.length > 0) {
        this.m_nBitsAvail = 32
        this.GrabNextDWord()
      } else {
        this.m_nInBufWord = 0
        this.m_nBitsAvail = 1
      }
      this.m_nInBufWord >>= (nAdjPosition & 31)
      this.m_nBitsAvail = Math.min(this.m_nBitsAvail, 32 - (nAdjPosition & 31))	// in case grabnextdword overflowed
    }
    return bSucc
  }
  SeekRelative (nOffset) {
    return this.Seek(this.GetNumBitsRead() + nOffset)
  }

  StartReading (data, bytes) {
    this.m_data = data
    this.m_dataIn = data.slice(0)
    this.m_nDataBytes = bytes
    this.m_nDataBits = bytes << 3
    this.m_bOverflow = false
    this.Seek(0)
  }

  GetNumBitsRead () {
    var nCurOfs = ((this.m_dataIn.length - this.m_data.length) / 4) - 1
    nCurOfs *= 32
    nCurOfs += (32 - this.m_nBitsAvail)
    var nAdjust = 8 * (this.m_nDataBytes & 3)
    return Math.min(nCurOfs + nAdjust, this.m_nDataBits)
  }
  GetNumBytesRead () {
    return ((this.GetNumBitsRead() + 7) >> 3)
  }

  GrabNextDWord (bOverFlowImmediately) {
    if (this.m_dataIn.length === 0) {
      this.m_nBitsAvail = 1									// so that next read will run out of words
      this.m_nInBufWord = 0
      this.m_dataIn = this.m_dataIn.slice(1)
      if (bOverFlowImmediately) {
        this.SetOverflowFlag()
      }
    } else if (this.m_dataIn.length < 0) {
      this.SetOverflowFlag()
      this.m_nInBufWord = 0
    } else {
      // TODO figure out this assert
      // assert(reinterpret_cast< int >(this.m_pDataIn) + 3 < reinterpret_cast< int >(this.m_pBufferEnd))
      this.m_nInBufWord = this.m_dataIn[0]
      this.m_dataIn = this.m_dataIn.slice(1)
    }
  }
  FetchNext () {
    this.m_nBitsAvail = 32
    this.GrabNextDWord(false)
  }

  ReadUBitLong (numbits) {
    if (this.m_nBitsAvail >= numbits) {
      let nRet = this.m_nInBufWord & s_nMaskTable[ numbits ] // unsigned int
      this.m_nBitsAvail -= numbits
      if (this.m_nBitsAvail) {
        this.m_nInBufWord >>= numbits
      } else {
        this.FetchNext()
      }
      return nRet
    } else {
      // need to merge words
      let nRet = this.m_nInBufWord // unsigned int
      numbits -= this.m_nBitsAvail
      this.GrabNextDWord(true)
      if (this.m_bOverflow) {
        return 0
      }
      nRet |= ((this.m_nInBufWord & s_nMaskTable[ numbits ]) << this.m_nBitsAvail)
      this.m_nBitsAvail = 32 - numbits
      this.m_nInBufWord >>= numbits
      return nRet
    }
  }

  ReadBytes (nBytes) {
    return this.ReadBits(nBytes << 3)
  }

  ReadBits (nBits) {
    var pOut = new Buffer(1 + (nBits / 8)) // unsigned char*
    var nBitsLeft = nBits
    var idx = 0

    // read remaining bytes
    while (nBitsLeft >= 8) {
      pOut[idx++] = this.ReadUBitLong(8)
      nBitsLeft -= 8
    }

    // read remaining bits
    if (nBitsLeft) {
      pOut[idx++] = this.ReadUBitLong(nBitsLeft)// *pOut = ReadUBitLong(nBitsLeft)
    }

    return pOut
  }

  ReadVarInt32 () {
    var result = 0 // uint32
    var count = 0 // int
    var b // uint32

    do {
      if (count === bitbuf.kMaxVarint32Bytes) {
        return result
      }
      b = this.ReadUBitLong(8)
      result |= (b & 0x7F) << (7 * count)
      ++count
    } while (b & 0x80 !== 0)

    return result
  }

  // Originality FTW
  FakeMemcpySlice (start, length) {
    return this.m_data.slice(start, start + length)
  }
}

module.exports = {
  bitbuf,
  CBitRead
}

// Understanding is hard.
// Adapting blindly is easy.
// from demofilebitbuf.(h|cpp) in Valve's demoinfogo

const bitbuf = {
  kMaxVarint32Bytes: 5
}

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
        throw new Error('Ugly WTF reached')
        // this.m_pDataIn = reinterpret_cast< uint32 const * > (reinterpret_cast< unsigned char const * >(this.m_pData) + ((nAdjPosition / 32) << 2) + nHead)
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

  ReadUBitLong (numbits) {
    if (this.m_nBitsAvail >= numbits) {
      let nRet = this.m_nInBufWord & this.s_nMaskTable[ numbits ] // unsigned int
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
      nRet |= ((this.m_nInBufWord & this.s_nMaskTable[ numbits ]) << this.m_nBitsAvail)
      this.m_nBitsAvail = 32 - numbits
      this.m_nInBufWord >>= numbits
      return nRet
    }
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
}

module.exports = {
  bitbuf,
  CBitRead
}

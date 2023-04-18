import { useEffect, useState, useRef } from "react"
import { getAuth, onAuthStateChanged } from 'firebase/auth'

export const useAuthStatus = () => {
  const [loggedIn, setLoggedIn] = useState(false)
  const [checkingStatus, setCheckingStatus] = useState(true)
  const isMOunted = useRef(true)

  useEffect(() => {
    if(isMOunted){
      const auth = getAuth()
      onAuthStateChanged(auth, (user) =>{
        if(user){
          setLoggedIn(true)
        }
          setCheckingStatus(false)
      })
    }
    return () =>{
      isMOunted.current= false
    }
  },[isMOunted])

  return { loggedIn, checkingStatus }
}

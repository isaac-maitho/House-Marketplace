import { useState, useEffect, useRef } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { getAuth, onAuthStateChanged } from 'firebase/auth'
import { getStorage, ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import { doc, updateDoc, getDoc, serverTimestamp, } from 'firebase/firestore';
import { db } from '../firebase.config'
import { toast } from 'react-toastify'
import { v4 as uuidv4 } from 'uuid'
import Spinner from '../components/Spinner'


function EditListing() {
  
  // eslint-disable-next-line
  const [ geolocationEnabled, setGeolocationEnabled ] = useState(false)
  const [ loading, setLoading ] = useState(false)
  const [ listing, setListing ] = useState(false)
  const [ formData, setFormData ] = useState({
    type: 'rent',
    name: '',
    bedrooms: 1,
    bathrooms: 1,
    parking: false,
    furnished: false,
    address: '',
    offer: false,
    regularPrice: 0,
    discountedPrice: 0,
    images: {},
    longitude: 0,
    latitude: 0
  })

  const {
        type,
        name,
        bedrooms,
        bathrooms,
        parking,
        furnished,
        address,
        offer,
        regularPrice,
        discountedPrice,
        images,
        longitude,
        latitude} = formData

  const auth = getAuth()
  const navigate = useNavigate()
  const params = useParams()
  const isMounted = useRef(true)

  //Redirect if the listing does not belong to the user
  useEffect(() =>{
    if(listing && listing.userRef !== auth.currentUser.uid){
      toast.error('You cannot edit the selected listing')
      navigate('/')
    }
  })


  //fetch listings to edit
  useEffect(() =>{
    setLoading(true)
    const fetchListing = async () =>{
      const docRef = doc(db, 'listings', params.listingId)
      const docSnap = await getDoc(docRef)
      if(docSnap.exists()){
        setListing(docSnap.data())
        setFormData({ ...docSnap.data() })
        setLoading(false)
      }else{
        navigate('/')
        toast.error('Listing does not exist')
      }
    }

    fetchListing()
  },[navigate, params.listingId])

  //sets userRef to logged in user
  useEffect(() => {
    if(isMounted){
      onAuthStateChanged(auth, (user) =>{
        if(user){
          setFormData({...formData, userRef: user.uid})
        }else{
          navigate('/sign-in')
        }
      })
    }
    return () =>{
      isMounted.current = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  },[isMounted])

  const onSubmit = async (e) =>{
    e.preventDefault()

    setLoading(true)
    if(discountedPrice >= regularPrice){
      setLoading(false)
      toast.error('Discounted price needs to be lower than the Regular price')
      return
    }

    if(images.length > 6){
      setLoading(false)
      toast.error('Max 6 images')
    }
    //Store images in firebase
    const storeImage = async (image) =>{
      return new Promise((resolve,reject) =>{
        const storage = getStorage()
        const fileName = `${auth.currentUser.uid}-${image.name}-${uuidv4()}`
        const storageRef = ref(storage,'images/' + fileName)
        const uploadTask = uploadBytesResumable(storageRef, image);
        uploadTask.on('state_changed', 
          (snapshot) => {
  
          const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          console.log('Upload is ' + progress + '% done');
          switch (snapshot.state) {
            case 'paused':
          console.log('Upload is paused');
            break;
            case 'running':
          console.log('Upload is running');
            break;
          default:
              break;
           }
         }, 
         (error) => {
          reject(error)
        }, 
        () => {
          // Handle successful uploads on complete
         // For instance, get the download URL: https://firebasestorage.googleapis.com/...
         getDownloadURL(uploadTask.snapshot.ref).then((downloadURL) => {
         resolve(downloadURL);
        });
       }
      );
     })
    }

    const imgUrls = await Promise.all(
      [...images].map((image) => storeImage(image))
    ).catch(() =>{
      setLoading(false)
      toast.error('Images not uploaded')
      return
    }) 
    
    const formDataCopy = {
      ...formData,
      imgUrls,
      timestamp: serverTimestamp()
    }
    
    delete formDataCopy.images

    //update listing
    const docRef = doc(db, 'listings', params.listingId)
    await updateDoc(docRef, formDataCopy)

    setLoading(false)
    toast.success('Listings updated successfully')
    navigate(`/category/${formDataCopy.type}/${docRef.id}`)
  }
  const onMutate = (e) =>{
    let boolean = null

    if(e.target.value === 'true'){
      boolean = true
    }
    if(e.target.value === 'false'){
      boolean = false
    }
    //Files
    if(e.target.files){
      setFormData((prevState) =>({
        ...prevState,
        images: e.target.files
      }))
    }
    //Texts/Booleans/Numbers
    if(!e.target.files){
      setFormData((prevState) =>({
        ...prevState,
        [e.target.id]: boolean ?? e.target.value,
      }))
    }
  }

  if(loading){
    return <Spinner />
  }
  return (
    <div className='profile'>
      <header>
        <p className="pageHeader">Edit Listing</p>
      </header>
      <main>
        <form onSubmit={onSubmit}>
          <label className="formLabel">Sell / Rent</label>
          <div className="formButtons">
            <button 
                type='button' 
                className={type === 'sale' ? 'formButtonActive' : 'formButton'}
                id='type'
                value='sale'
                onClick={onMutate}>
              Sell
            </button>
            <button 
                type='button' 
                className={type === 'rent' ? 'formButtonActive' : 'formButton'}
                id='type'
                value='rent'
                onClick={onMutate}>
              Rent
            </button>
          </div>
          <label className="formLabel">Name</label>
          <input 
             type="text" 
             className="formInputName"
             id='name'
             value={name} 
             onChange={onMutate}
             maxLength= '32'
             minLength= '10'
             required
             />
          <div className="formRooms flex">
            <div>
              <label className="formLabel">Bedrooms</label>
              <input 
                type="number" 
                className="formInputSmall"
                id='bedrooms'
                value={bedrooms} 
                onChange={onMutate}
                max= '50'
                min= '1'
                required
             />
            </div>
            <div>
            <label className="formLabel">Bathrooms</label>
              <input 
                type="number" 
                className="formInputSmall"
                id='bathrooms'
                value={bathrooms} 
                onChange={onMutate}
                max= '50'
                min= '1'
                required
             />
            </div>
          </div>
          <label className="formLabel">Parking Spot</label>
          <div className="formButtons">
              <button 
                type="button" 
                className={parking ? 'formButtonActive' : 'formButton'}
                id='parking'
                value={true} 
                onClick={onMutate}
                max= '50'
                min= '1'
                required>
                Yes
             </button>
             <button 
                type="button" 
                className={!parking && parking !==null ? 'formButtonActive' : 'formButton'}
                id='parking'
                value={false} 
                onClick={onMutate}
                max= '50'
                min= '1'
                required>
                No
             </button>
          </div>
          <label className="formLabel">Furnished</label>
          <div className="formButtons">
              <button 
                type="button" 
                className={furnished ? 'formButtonActive' : 'formButton'}
                id='furnished'
                value={true} 
                onClick={onMutate}>
                Yes
             </button>
             <button 
                type="button" 
                className={!furnished && furnished !==null ? 'formButtonActive' : 'formButton'}
                id='furnished'
                value={false} 
                onClick={onMutate}
                >
                No
             </button>
           </div> 
           <label className="formLabel">Address</label>
              <textarea 
                type="text" 
                className="formInputAddress"
                id='address'
                value={address} 
                onChange={onMutate}
                required
             /> 
             {!geolocationEnabled && (
              <div className="formLatLng flex">
                <div>
                  <label className="formLabel">Latitude</label>
                  <input 
                     type="number" 
                     className="formInputSmall"
                     id='latitude'
                     value={latitude}
                     onChange={onMutate}
                     required />
                </div>
                <div>
                  <label className="formLabel">Longitude</label>
                  <input 
                     type="number" 
                     className="formInputSmall"
                     id='longitude'
                     value={longitude}
                     onChange={onMutate}
                     required />
                </div>
              </div>
             )}
          <label className="formLabel">Offer</label>
          <div className="formButtons">
              <button 
                type="button" 
                className={offer ? 'formButtonActive' : 'formButton'}
                id='offer'
                value={true} 
                onClick={onMutate}>
                Yes
             </button>
             <button 
                type="button" 
                className={!offer && offer !==null ? 'formButtonActive' : 'formButton'}
                id='offer'
                value={false} 
                onClick={onMutate}
                >
                No
             </button>
          </div>
          <label className="formLabel">Regular Price</label>
          <div className="formPriceDiv">
          <input 
             type="number" 
             className="formInputSmall"
             id='regularPrice'
             value={regularPrice} 
             onChange={onMutate}
             maxLength= '7500000'
             minLength= '50'
             required
             />  
             {type === 'rent' && (
              <p className='formPriceText'>$ / month</p>
             )}
          </div>

        {offer && (
          <>
          <label className="formLabel">Discounted Price</label>
            <input 
             type="number" 
             className="formInputSmall"
             id='discountedPrice'
             value={discountedPrice} 
             onChange={onMutate}
             maxLength= '7500000'
             minLength= '50'
             required={offer}
             /> 
            </> 
          )}

          <label className="formLabel">Images</label>
          <p className="imagesInfo">The first image will be the cover (max 6).</p>
          <input 
             type="file" 
             className="formInputFile"
             id='images'
             onChange={onMutate}
             max='6'
             accept='.jpg,.png,.jpeg'
             multiple
             required
             /> 
            <button type='submit' className="primaryButton createListingButton">Edit Listing</button> 
        </form>
      </main>
    </div>
  )
}

export default EditListing
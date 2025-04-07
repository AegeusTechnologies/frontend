import axios from "axios"

const RobotError=()=>{

  const [devices,setDevices]=useState([])
  const [loading, setLoading]= useState()
  const [error,setError]=useState()


async function getDevices(){
  setLoading(true)
  const response =  await axios.get(`${process.env.REACT_APP_BACKEND_URL}/devices`)
  if(response.data.success){
    setDevices(response.data.result)
  }else{
    setError(response.data.error)
  }
}

async function getDeviceData(){
  setLoading(true)
  await devices.map(async(device)=>{
    const response = await axios.get(`${process.env.REACT_APP_BACKEND_URL}/devices/${}`)
  })
}

  return(
    <div>
      <h1>hi this page is for the </h1>
    </div>

  )

}
import axios from axios;

const SpacedGets = () => {
    setInterval

useEffect(() => {
    getRequest();
}, []);

const getRequest = async () => {
    try {
        const response = await axios.get('http://localhost:5000/');
        console.log('site up', response.status);
    }
    catch (e) {
        console.log('fetch error:',e);
    }
};

return (
    <div>


    </div>
)


}
import axios from 'axios'

const mainAxios = axios.create({
  baseURL: 'http://localhost:8090',
  withCredentials: true, 
})

const customAxios = axios.create({
  baseURL: 'http://localhost:8090',
  withCredentials: true, 
})
// 요청 인터셉터 설정
customAxios.interceptors.request.use(config => {
  // 여기에서 토큰을 로컬 스토리지 또는 Vuex 스토어에서 가져옵니다.
  const token = localStorage.getItem('token'); // 또는 Vuex에서 가져오기

  if (token && token != undefined) {
    config.headers.access = `${token}`;
  }

  return config;
}, error => {
  return Promise.reject(error);
});
customAxios.interceptors.response.use(response => {
  return response;
}, async error => {
  const originalRequest = error.config;

  // 403 Forbidden 오류 처리
  if (error.response.status === 401 && !originalRequest._retry) {
    originalRequest._retry = true;

    try {
      //const refreshToken = localStorage.getItem('refresh');
      const response = await axios.post('http://localhost:8090/reissue', {},{ withCredentials: true });

      console.log(response);
      const newToken = response.headers['access'];
      localStorage.setItem('token', newToken);

      // 새 토큰으로 원래 요청 다시 시도
      originalRequest.headers.access = `${newToken}`;
      return axios(originalRequest);
    } catch (refreshError) {
      // 리프레시 토큰 갱신 실패 시 로그아웃 처리
      console.error('토큰 갱신 실패:', refreshError);
      localStorage.removeItem('token');
      localStorage.removeItem('refresh');
      //window.location.href = '/login';
      return Promise.reject(refreshError);
    }
  }

  return Promise.reject(error);
});
export {
  mainAxios,
  customAxios
}

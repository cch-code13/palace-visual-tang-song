// src/utils/dataCache.js
export const getCachedData = (key) => {
  try {
    const cachedData = localStorage.getItem(key);
    if (cachedData) {
      return JSON.parse(cachedData);
    }
    return null;
  } catch (error) {
    console.error('Error getting cached data:', error);
    return null;
  }
};

export const setCachedData = (key, data, expiration = 24 * 60 * 60 * 1000) => {
  try {
    const cacheData = {
      data,
      expires: Date.now() + expiration
    };
    localStorage.setItem(key, JSON.stringify(cacheData));
  } catch (error) {
    console.error('Error setting cached data:', error);
  }
};

export const isDataExpired = (key) => {
  try {
    const cachedData = localStorage.getItem(key);
    if (cachedData) {
      const { expires } = JSON.parse(cachedData);
      return Date.now() > expires;
    }
    return true;
  } catch (error) {
    console.error('Error checking data expiration:', error);
    return true;
  }
};

// 获取缓存数据，如果过期则重新计算
export const getOrComputeData = (key, computeFn, expiration = 24 * 60 * 60 * 1000) => {
  if (!isDataExpired(key)) {
    const cachedData = getCachedData(key);
    if (cachedData) {
      return cachedData.data;
    }
  }
  
  const data = computeFn();
  setCachedData(key, data, expiration);
  return data;
};
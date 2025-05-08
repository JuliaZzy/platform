// src/utils/queuedPost.js
import axios from 'axios';

const queue = [];
let active = false;

export default function queuedPost(url, data) {
  return new Promise((resolve, reject) => {
    queue.push({ url, data, resolve, reject });
    if (!active) runNext();
  });

  async function runNext() {
    if (!queue.length) {
      active = false;
      return;
    }
    active = true;
    const { url, data, resolve, reject } = queue.shift();
    try {
      const res = await axios.post(url, data);
      resolve(res);
    } catch (err) {
      reject(err);
    } finally {
      runNext();
    }
  }
}

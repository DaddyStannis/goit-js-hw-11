import axios from 'axios';
import { throttle } from 'lodash';
import { Notify } from 'notiflix';
import SimpleLightbox from 'simplelightbox';
import 'simplelightbox/dist/simple-lightbox.min.css';

const PIXABAY_KEY = '33096086-1194933faea6ce020ed133eb1';
const refs = {
  gallery: document.getElementById('gallery'),
  searchForm: document.getElementById('search_form'),
};
const limit = 40;
let page = 1;
let prevNotifyTime = 0;
let searchString = '';
const lightbox = new SimpleLightbox('.gallery a');

refs.searchForm.addEventListener('submit', event => {
  event.preventDefault();
  refs.gallery.innerHTML = '';
  const value = event.currentTarget.elements['searchQuery'].value.trim();
  page = 1;
  if (value.length) {
    searchString = value;
    requestImages(searchString, page, limit, responseHandler);
  }
});

window.addEventListener(
  'scroll',
  throttle(event => {
    const scrollTop = document.documentElement.scrollTop;
    const scrollHeight = document.documentElement.scrollHeight;
    const clientHeight = document.documentElement.clientHeight;

    if (scrollTop + clientHeight > scrollHeight - 400) {
      ++page;
      requestImages(searchString, page, limit, responseHandler);
    }
  }, 500)
);

async function requestImages(searchString, page, limit, onResponse, onError) {
  try {
    const response = await axios.get(
      `https://pixabay.com/api?key=${PIXABAY_KEY}&page=${page}&per_page=${limit}&q=${searchString}&image_type=photo&orientation=horizontal&safesearch=true`
    );
    onResponse(response.data);
  } catch (error) {
    // onError(error);
    console.error(error);
  }
}

function responseHandler(data) {
  if (data.totalHits == 0) {
    Notify.failure(
      'Sorry, there are no images matching your search query. Please try again.'
    );
  } else if (refs.gallery.childNodes.length == data.totalHits) {
    let timeNow = Date.now();
    if (timeNow - (prevNotifyTime + 3000) > 0) {
      Notify.info(
        "We're sorry, but you've reached the end of search results.",
        {
          position: 'right-bottom',
        }
      );
      prevNotifyTime = timeNow;
    }
    --page;
  } else {
    if (page == 1) {
      Notify.success(`Hooray! We found ${data.totalHits} images.`);
    }
    printPreviewImgs(data);
    lightbox.refresh();
  }
}

function printPreviewImgs(data) {
  const images = data.hits;

  const markup = images.reduce((accum, img) => {
    return (
      accum +
      `
        <div class="photo-card">
          <a href="${img.largeImageURL}">
            <img class="photo" src="${img.webformatURL}" alt="${img.tags}" loading="lazy" width="100"/>
          </a>
          <div class="info">
            <p class="info-item">
              <b>${img.likes}</b>
            </p>
            <p class="info-item">
              <b>${img.views}</b>
            </p>
            <p class="info-item">
              <b>${img.comments}</b>
            </p>
            <p class="info-item">
              <b>${img.downloads}</b>
            </p>
          </div>
        </div>
      `
    );
  }, '');

  refs.gallery.insertAdjacentHTML('beforeend', markup);
}

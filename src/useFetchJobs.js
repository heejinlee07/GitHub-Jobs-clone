import { useReducer, useEffect } from "react";
import axios from "axios";

/**
 * in order to define all of our actions
 * set to an 'object' - which defines our actions
 * later, we can reference them
 *
 * we can perform on our state
 */
const ACTIONS = {
  MAKE_REQUEST: "make-request",
  //request finishes it's going to get our data from that request
  GET_DATA: "get_data",
  ERROR: "error",
  UPDATE_HAS_NEXT_PAGE: "update-has-next-page",
};

//using heroku solved CORS problem- put them in front of url its acts as a proxy for us, don't need to create our own proxy server
const BASE_URL =
  "https://cors-anywhere.herokuapp.com/https://jobs.github.com/positions.json";

/**
 * @description
 * going to take in a state, action
 * this function gets called every time we call dispatch
 * @param {*} state - whatever our current state of the application is
 * @param {*} action - dispatch whatever we pass to it is populated inside of action veriable
 */

function reducer(state, action) {
  switch (action.type) {
    //return a new state
    case ACTIONS.MAKE_REQUEST:
      return { loading: true, jobs: [] };
    // take a current state and put that in our new state
    // jobs - we're going to pass our jobs in on the payload of our action and set them.
    case ACTIONS.GET_DATA:
      return { ...state, loading: false, jobs: action.payload.jobs };
    case ACTIONS.ERROR:
      return {
        ...state,
        loading: false,
        error: action.payload.error,
        jobs: [],
      };
    case ACTIONS.UPDATE_HAS_NEXT_PAGE:
      return {
        ...state,
        hasNextPage: action.payload.hasNextPage,
      };
    default:
      return state;
  }
}

/**
 * custom hook useFetchJobs
 * @param {object} params - object of all of our params
 * @param {number} page - page number that we're currently on
 */

export default function useFetchJobs(params, page) {
  /**
   * useReducer()
   * @param {function} reducer - to handle all of the different state inside of our custom hook
   * @param {object} { jobs: [], loading: true } - take an initial state
   */

  const [state, dispatch] = useReducer(reducer, { jobs: [], loading: true });

  /**
   * @description convention
   * set a 'type' - for different values or different actions we can perform
   * payload - data for that type
   */

  /**
   * everytime change our parameters, reload our page
   * if we change our page number, go back
   * change page or params we need to run our code again using useEffect
   */
  useEffect(() => {
    // get us a new cancel token we can use
    const cancelToken1 = axios.CancelToken.source();
    dispatch({ type: ACTIONS.MAKE_REQUEST });
    axios
      .get(BASE_URL, {
        // pass our cancelToken here, to get the actual token itself
        // have a reference to this access request inside of this cancel token
        // cancelToken 내부에 액세스 요청에 대한 참조가 있다.
        cancelToken: cancelToken1.token,
        //...params - 그리고 나머지 params를 포함시킨다.
        params: { markdown: true, page: page, ...params },
      })
      .then((res) => {
        //res.data는 json data
        dispatch({ type: ACTIONS.GET_DATA, payload: { jobs: res.data } });
      })
      .catch((e) => {
        if (axios.isCancel(e)) return;
        dispatch({ type: ACTIONS.ERROR, payload: { error: e } });
      });

    //hack. UPDATE_HAS_NEXT_PAGE

    const cancelToken2 = axios.CancelToken.source();
    axios
      .get(BASE_URL, {
        // pass our cancelToken here, to get the actual token itself
        // have a reference to this access request inside of this cancel token
        // cancelToken 내부에 액세스 요청에 대한 참조가 있다.
        cancelToken: cancelToken2.token,
        //...params - 그리고 나머지 params를 포함시킨다.
        params: { markdown: true, page: page + 1, ...params },
      })
      .then((res) => {
        //res.data는 json data
        dispatch({
          type: ACTIONS.UPDATE_HAS_NEXT_PAGE,
          payload: { hasNextPage: res.data.length !== 0 },
        });
      })
      .catch((e) => {
        if (axios.isCancel(e)) return;
        dispatch({ type: ACTIONS.ERROR, payload: { error: e } });
      });

    return () => {
      // cancel token individually cancel each one of these requests
      cancelToken1.cancel();
      cancelToken2.cancel();
    };
  }, [params, page]);

  return state;
}

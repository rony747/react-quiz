import './App.css'
import Header from "./components/Header.jsx";
import Main from "./components/Main.jsx";
import {useEffect, useReducer} from "react";
import Loader from "./components/Loader.jsx";
import Error from "./components/Error.jsx";
import StartScreen from "./components/StartScreen.jsx";
import Question from "./components/Question.jsx";
import NextButton from "./components/NextButton.jsx";
import Progress from "./components/Progress.jsx";
import FinishScreen from "./components/FinishScreen.jsx";
import Footer from "./components/Footer.jsx";
import Timer from "./components/Timer.jsx";

const SECS_PER_QUSTION = 1;
const initialState = {
    questions: [],

    // loading, error, ready, active, finished
    status: 'loading',
    index: 0,
    answer: null,
    points: 0,
    highscore: 0,
    secondsRemaining: null
}

function reducer(state, action) {
    switch (action.type) {
        case 'dataReceived':
            return {
                ...state, questions: action.payload,
                status: 'ready'
            }
        case 'dataFailed':
            return {
                ...state, status: 'error'
            }
        case 'start':
            return {...state, status: 'active', secondsRemaining: state.questions.length * SECS_PER_QUSTION}
        case 'newAnswer':
            const question = state.questions.at(state.index)
            return {
                ...state, answer: action.payload,
                points: action.payload === question.correctOption ? state.points + question.points : state.points
            }
        case 'nextQuestion':
            return {...state, index: state.index + 1, answer: null}
        case 'finished':
            return {
                ...state,
                status: "finished",
                highscore:
                    state.points > state.highscore ? state.points : state.highscore,
            }
        case 'restart':
            return {
                ...initialState, questions: state.questions, highscore:
                state.highscore, status: "ready"
            }
        case 'tick':
            return {
                ...state,
                secondsRemaining: state.secondsRemaining - 1,
                status: state.secondsRemaining === 0 ? 'finished' : state.status,
                highscore:
                    state.points > state.highscore ? state.points : state.highscore
            }
        default:
            throw new Error("Action Unknown")
    }
}

function App() {
    const [{
        questions,
        status,
        index,
        answer,
        points,
        highscore,
        secondsRemaining
    }, dispatch] = useReducer(reducer, initialState)
    const numQuestions = questions.length
    const maxPossiblePoints = questions.reduce((prev, cur) => prev + cur.points, 0)
    useEffect(() => {
        fetch('http://localhost:8000/questions').then(res => res.json()).then(data => {
            dispatch({type: 'dataReceived', payload: data})
        }).catch(err => {
            dispatch({
                type: 'dataFailed'
            })
        })
    }, [])
    return (
        <>
            <Header/>
            <Main>
                {status === 'loading' && <Loader/>}
                {status === 'error' && <Error/>}
                {status === 'ready' && <StartScreen numQuestions={numQuestions} dispatch={dispatch}/>}
                {status === 'active' && (
                    <>
                        <Progress index={index} numQuestions={numQuestions} points={points}
                                  maxPossiblePoints={maxPossiblePoints} answer={answer}/>
                        <Question question={questions[index]} dispatch={dispatch} answer={answer}/>
                        <Footer>
                            <Timer dispatch={dispatch} secondsRemaining={secondsRemaining}/>
                            <NextButton dispatch={dispatch} answer={answer} index={index} numQuestions={numQuestions}/>
                        </Footer>
                    </>
                )}
                {status === 'finished' &&
                    <FinishScreen points={points} maxPossiblePoints={maxPossiblePoints} highscore={highscore}
                                  dispatch={dispatch}/>}
            </Main>
        </>
    )
}

export default App

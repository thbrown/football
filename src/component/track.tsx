import { Button, Slider } from "@blueprintjs/core";
import React from "react";
import { Clock } from "../clock";
import { MakePlay } from "../make-play";

interface Props {
    clock: Clock;
    scene: MakePlay;
}

type TrackState = "play" | "pause" | "repeat";

export const Track: React.FC<Props> = ({clock, scene}) => {
    const [trackState, setTrackState] = React.useState<TrackState>("pause");

    const togglePlay = () => {
        if(trackState === "repeat") {
            clock.reset(false);
            setTrackState("play");
            return;
        }
        setTrackState(trackState === "pause" ? "play" : "pause");
    }

    const getTrackIcon = (state: TrackState) => {
        switch (state) {
            case "play":
                return "pause";
            case "pause":
                return "play";
            case "repeat":
                return "repeat";
            default:
                return "play";
        }
    };

    React.useEffect(() => {
        let animationFrameId: number;
        let lastTime = performance.now();

        const updateClock = (currentTime: number) => {
            const deltaTime = currentTime - lastTime;
            lastTime = currentTime;

            const newElapsedTime = clock.getElapsedTime() + deltaTime;
            if (newElapsedTime >= clock.getMaxTime()) {
                clock.stop();
                clock.gotoTime(clock.getMaxTime());
                setTrackState("repeat");
            } else {
                clock.gotoTime(newElapsedTime);
                animationFrameId = requestAnimationFrame(updateClock);
            }
        };

        if (trackState === "play") {
            animationFrameId = requestAnimationFrame(updateClock);
        } else {
            cancelAnimationFrame(animationFrameId);
        }

        return () => cancelAnimationFrame(animationFrameId);
    }, [trackState, clock]);

    const maxTime = clock.getMaxTime();
    
    return (
        <div className="track-wrapper" style={{backgroundColor: clock.getIsRecording() ? "red" : "green"}}>
            <Button className="track-button" icon={getTrackIcon(trackState)} onClick={togglePlay} disabled={clock.getMaxTime() <= 0}></Button>
            {/*<Button className="track-button" icon="record" onClick={() => {console.log("PRESS")}} disabled={clock.getIsActive()}></Button>*/}
            <Slider className="track-slider" showTrackFill={true} labelStepSize={1} stepSize={.01} value={clock.getElapsedTime()/1000} onChange={(v) => {setTrackState("pause"); clock.gotoTime(v*1000)}} min={0} max={maxTime/1000} disabled={clock.getMaxTime() <= 0}/>
        </div>
    );
};
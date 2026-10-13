import { ArrowRight, Lightbulb } from 'lucide-react'
import type { TacticBlock, TacticLesson } from '../../types'
import Board from '../../components/Board'
import RichText from './RichText'
import { useLessonProgress } from './useTacticsProgress'

/** Step 1: read the idea. Text, tips and board pictures, in the order the lesson gives them. */
export default function LearnStep({ lesson, onNext }: { lesson: TacticLesson; onNext: () => void }) {
  const { markIntroSeen } = useLessonProgress(lesson)

  function finish() {
    markIntroSeen()
    onNext()
  }

  return (
    <article className="tx-article">
      <div className="eyebrow">Step 1 · Learn the idea</div>
      {lesson.intro.length === 0 && <p className="muted">This lesson has no reading yet. Jump straight to the examples.</p>}
      {lesson.intro.map((block, i) => (
        <Block key={i} block={block} />
      ))}
      <div className="tx-step-footer">
        <button className="btn primary big" onClick={finish}>
          {lesson.examples.length ? 'Next: watch it happen' : 'Next: try it yourself'} <ArrowRight size={18} aria-hidden />
        </button>
      </div>
    </article>
  )
}

function Block({ block }: { block: TacticBlock }) {
  switch (block.type) {
    case 'text':
      return <RichText text={block.text} className="tx-text" />
    case 'tip':
      return (
        <div className="callout tx-tip">
          <Lightbulb size={20} aria-hidden />
          <RichText text={block.text} className="tx-tip-text" />
        </div>
      )
    case 'board':
      return (
        <figure className={`card tx-figure ${block.caption ? '' : 'no-caption'}`}>
          <div className="tx-figure-board">
            <Board
              fen={block.fen}
              orientation={block.orientation ?? 'white'}
              arrows={block.arrows}
              highlights={block.highlights}
              animationMs={0}
            />
          </div>
          {block.caption && <figcaption>{block.caption}</figcaption>}
        </figure>
      )
  }
}

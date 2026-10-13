import { Link, useParams } from 'react-router-dom'
import { AlertTriangle, ArrowRight, BookOpen, Dumbbell, Layers, Shuffle, Shield, Swords } from 'lucide-react'
import type { OpeningChapter, OpeningCourse } from '../../types'
import { useCourse } from './courses'
import { chapterMastery, courseMastery, hasStarted, nextStep, progressKey, sortedChapters, useOpeningProgress } from './progress'
import { lineCount, parseChapter, realText, signatureText } from './treeUtils'
import { Crumbs, DifficultyDots, MasteryBar, MiniBoard, Notice, SideIcon } from './components/shared'

// /openings/<courseId>: the home of one opening, with its ideas, common mistakes and chapters.

export default function CoursePage() {
  const { courseId } = useParams()
  const course = useCourse(courseId)
  if (!course) {
    return (
      <Notice title="We could not find that opening" back={{ to: '/openings', label: 'See all openings' }}>
        Maybe the link is old. Pick one of your openings from the list.
      </Notice>
    )
  }
  return <CourseHome course={course} />
}

function CourseHome({ course }: { course: OpeningCourse }) {
  const progress = useOpeningProgress()
  const step = nextStep(course, progress)
  const started = hasStarted(course, progress)
  const chapters = sortedChapters(course)
  const youPlay = course.side === 'white' ? 'White' : 'Black'
  const opponent = course.side === 'white' ? 'Black' : 'White'
  const playable = chapters.some((c) => parseChapter(c).ok)
  const totalLines = chapters.reduce((sum, c) => {
    const parsed = parseChapter(c)
    return sum + (parsed.ok ? lineCount(parsed.tree) : 0)
  }, 0)

  return (
    <div className="page op-page">
      <Crumbs items={[{ label: 'Openings', to: '/openings' }, { label: course.name }]} />

      <header className="card op-course-hero">
        <SideIcon side={course.side} size={72} />
        <div className="op-hero-text">
          <div className="op-you-play">You play {youPlay}</div>
          <h1>{course.name}</h1>
          {realText(course.tagline) && <p className="op-tagline">{realText(course.tagline)}</p>}
          {course.signatureMoves.length > 0 && <div className="op-moves">{signatureText(course.signatureMoves)}</div>}
          {chapters.length > 0 && (
            <div className="row wrap">
              <span className="chip">
                <Layers size={14} aria-hidden /> {chapters.length} {chapters.length === 1 ? 'variation' : 'variations'}
              </span>
              <span className="chip">{totalLines} lines to learn</span>
            </div>
          )}
          <div className="op-hero-progress">
            <MasteryBar value={courseMastery(progress, course)} label="How well you know it" />
          </div>
        </div>
      </header>

      <div className="op-actions-row">
        {step && (
          <Link className="btn primary big" to={`/openings/${course.id}/${step.chapter.id}/${step.mode}`}>
            {started ? 'Continue' : 'Start learning'} <ArrowRight size={18} aria-hidden />
          </Link>
        )}
        <Link
          className="btn"
          to={`/openings/${course.id}/quiz`}
          aria-disabled={!playable}
          onClick={(e) => !playable && e.preventDefault()}
        >
          <Shuffle size={17} aria-hidden /> Quiz me on everything
        </Link>
        <Link className="btn" to={`/play?course=${course.id}&mode=practice`}>
          <Swords size={17} aria-hidden /> Play it against the computer
        </Link>
        <Link className="btn" to={`/play?course=${course.id}&mode=face`}>
          <Shield size={17} aria-hidden /> Face it as the opponent
        </Link>
      </div>
      <p className="small muted op-actions-note zen-hide">
        <strong>Play it</strong>: you play {youPlay} and the computer follows the lessons. <strong>Face it</strong>: the
        computer plays the {course.name} and you play {opponent}, so you learn how to answer it.
      </p>

      {course.overview.length > 0 && (
        <section className="op-section" aria-labelledby="op-overview">
          <h2 id="op-overview">What is it?</h2>
          <div className="op-prose">
            {course.overview.map((p, i) => (
              <p key={i}>{p}</p>
            ))}
          </div>
        </section>
      )}

      {course.keyIdeas.length > 0 && (
        <section className="op-section" aria-labelledby="op-ideas">
          <h2 id="op-ideas">Key ideas</h2>
          <div className="op-idea-grid">
            {course.keyIdeas.map((idea) => (
              <article key={idea.title} className="card op-idea">
                <MiniBoard card={idea} fallbackSide={course.side} />
                <h3>{idea.title}</h3>
                <p className="muted">{idea.text}</p>
              </article>
            ))}
          </div>
        </section>
      )}

      {course.commonMistakes.length > 0 && (
        <section className="op-section" aria-labelledby="op-mistakes">
          <h2 id="op-mistakes">Common mistakes</h2>
          <div className="op-idea-grid">
            {course.commonMistakes.map((m) => (
              <article key={m.title} className="card op-idea op-mistake">
                <MiniBoard card={m} fallbackSide={course.side} />
                <h3>
                  <AlertTriangle size={16} aria-hidden /> {m.title}
                </h3>
                <p className="muted">{m.text}</p>
              </article>
            ))}
          </div>
        </section>
      )}

      <section className="op-section" aria-labelledby="op-chapters">
        <h2 id="op-chapters">Variations</h2>
        {chapters.length === 0 ? (
          <div className="card muted">The lessons for this opening are still being written. Please check back soon.</div>
        ) : (
          <ol className="op-chapter-list">
            {chapters.map((chapter, i) => (
              <ChapterRow key={chapter.id} index={i + 1} course={course} chapter={chapter} />
            ))}
          </ol>
        )}
      </section>
    </div>
  )
}

function ChapterRow({ index, course, chapter }: { index: number; course: OpeningCourse; chapter: OpeningChapter }) {
  const progress = useOpeningProgress()
  const entry = progress[progressKey(course.id, chapter.id)]
  const parsed = parseChapter(chapter)
  const mastery = chapterMastery(progress, course.id, chapter.id)
  const base = `/openings/${course.id}/${chapter.id}`

  return (
    <li className="card op-chapter">
      <span className="op-chapter-no" aria-hidden>
        {index}
      </span>
      <div className="op-chapter-main">
        <h3>{chapter.title}</h3>
        {realText(chapter.summary) && <p className="muted">{realText(chapter.summary)}</p>}
        <div className="row wrap op-chapter-meta">
          <DifficultyDots level={chapter.difficulty} />
          {parsed.ok && <span className="small faint">{lineCount(parsed.tree)} lines</span>}
          {entry?.studied === true && <span className="chip green">Studied</span>}
          {!parsed.ok && (
            <span className="chip red" title={parsed.error}>
              Problem with this chapter
            </span>
          )}
        </div>
      </div>
      <div className="op-chapter-side">
        <MasteryBar value={mastery} label={`${chapter.title}: how well you know it`} showLabel={false} />
        <div className="row op-chapter-buttons">
          <Link
            className="btn small"
            to={`${base}/study`}
            aria-disabled={!parsed.ok}
            onClick={(e) => !parsed.ok && e.preventDefault()}
          >
            <BookOpen size={15} aria-hidden /> Study
          </Link>
          <Link
            className="btn small primary"
            to={`${base}/drill`}
            aria-disabled={!parsed.ok}
            onClick={(e) => !parsed.ok && e.preventDefault()}
          >
            <Dumbbell size={15} aria-hidden /> Drill
          </Link>
        </div>
      </div>
    </li>
  )
}

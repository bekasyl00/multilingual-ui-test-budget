# Risk-based testing of multilingual web interfaces
**Research proposal | Bekasyl Zhaksylyk | MSc by Research, September 2027**

Translated labels, narrow viewports and user text spacing can interact in ways that a small test suite misses. I want to measure which affordable configuration-selection methods find reproducible interface problems and how often geometry flags correspond to loss of content or inability to complete a task.

The initial technical report contains a controlled case in which a twelve-test pairwise suite misses a three-factor clipping failure despite full pair coverage. The follow-up pilot runs two defined actions each in IT-Tools, PDF.js and Kiwix JS under a matrix of language, viewport width and text spacing. The code records task outcomes separately from visual signals. This provides an instrument and screening baseline for a broader evaluation.

I propose extending the corpus using pinned open-source builds and a prespecified task list. Two reviewers would independently adjudicate a stratified sample of signals and negatives, distinguish recoverable overflow from functional loss, and group repeated observations by root cause. At equal budgets I would compare uniform random, pairwise and a simple width-and-spacing rule, reporting validated defect-family recall, review burden, uncertainty and execution time. A later experiment could evaluate a learned or relational prioritiser trained only on other applications. The learned method would be assessed on held-out applications against all three fixed baselines.

The expected output is a runnable benchmark, a documented review protocol, and evidence about when test selection saves effort under fixed budgets. The current results are a development pilot. Human review and evaluation across a larger set of applications remain future work.

I am a Software Engineering undergraduate at Astana IT University and expect to graduate in 2027. I intend to apply for Kazakhstan’s Bolashak scholarship. [Technical report and reproducibility package](https://github.com/bekasyl00/multilingual-ui-test-budget)

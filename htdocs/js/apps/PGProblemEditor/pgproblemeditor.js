(function () {
	if (CodeMirror) {
		cm = CodeMirror.fromTextArea(
			$("#problemContents")[0], {
				mode: "PG",
				indentUnit: 4,
				tabMode: "spaces",
				lineNumbers: true,
				lineWrapping: true,
				extraKeys:
				{Tab: function(cm) {cm.execCommand('insertSoftTab')}},
				highlightSelectionMatches: true,
				matchBrackets: true,

			});
		cm.setSize("100%", 400);
	}

	// Initialize MathQuill
	var MQ = MathQuill.getInterface(2);
	var mathQuillButtons = [
		{ id: 'frac', latex: '/', tooltip: 'fraction (/)', icon: '\\frac{\\text{\ \ }}{\\text{\ \ }}' },
		{ id: 'sqrt', latex: '\\sqrt', tooltip: 'square root (sqrt)', icon: '\\sqrt{\\text{\ \ }}' },
		// Add more MathQuill buttons as needed
	];

	// Function to handle MathQuill button click
	function handleMathQuillButtonClick(latex) {
		var cursor = cm.getCursor();
		cm.replaceRange(latex, cursor);
		cm.focus();
	}

	// Create MathQuill buttons for the problem editor
	var mathQuillToolbar = $("<div class='mathquill-toolbar'></div>");
	mathQuillButtons.forEach(function (button) {
		var buttonElement = $("<button class='mathquill-button' title='" + button.tooltip + "'>" + button.icon + "</button>");
		buttonElement.click(function () {
			handleMathQuillButtonClick(button.latex);
		});
		mathQuillToolbar.append(buttonElement);
	});
	$("#problemEditorToolbar").append(mathQuillToolbar);

	$(document).keydown(function(e){
		if (e.keyCode === 27) $('#render-modal').modal('hide');
	});

	$('#render-modal').modal({ keyboard: true, show: false });

	var busyIndicator = null;

	$('#pg_editor_frame_id').on('load', function () {
		if (busyIndicator) {
			busyIndicator.remove();
			busyIndicator = null;
		}
		var contents = $('#pg_editor_frame_id').contents();
		if (contents[0].URL == "about:blank") return;
		contents.find("head").append("<style>#site-navigation,#toggle-sidebar,#masthead,#breadcrumb-row,#footer{display:none;}</style>");
		contents.find('#content').removeClass('span10');
		$('#render-modal').modal('show');
	});

	$('#submit_button_id').on('click', function() {
		var actionView = document.getElementById('action_view');
		var actionSave = document.getElementById('action_save');

		var target = "_self";
		if (actionView && actionView.classList.contains('active'))
			target = document.getElementById("newWindowView").checked ? "WW_View" : "pg_editor_frame";
		else if (actionSave && actionSave.classList.contains('active'))
			target = document.getElementById("newWindowSave").checked ? "WW_View" : "pg_editor_frame";

		$("#editor").attr('target', target);

		if (target == "pg_editor_frame") {
			busyIndicator = $('<div class="page-loading-busy-indicator" data-backdrop="static" data-keyboard="false">' +
				'<div class="busy-text"><h2>Loading...</h2></div>' +
				'<div><i class="fas fa-circle-notch fa-spin fa-3x"></i></div>' +
				'</div>');
			$('body').append(busyIndicator);
		}
	});
})();

// initialize MathQuill
var MQ = MathQuill.getInterface(2);
var answerQuills = {};

// Avoid conflicts with bootstrap.
$.widget.bridge('uitooltip', $.ui.tooltip);

$("[id^=MaThQuIlL_]").each(function() {
	var answerLabel = this.id.replace(/^MaThQuIlL_/, "");
	var input = $("#" + answerLabel);
	var inputType = input.attr('type');
	if (typeof(inputType) != 'string' || inputType.toLowerCase() !== "text" || !input.hasClass('codeshard')) return;

	var answerQuill = $("<span id='mq-answer-" + answerLabel + "'></span>");
	answerQuill.input = input;
	input.addClass('mq-edit');
	answerQuill.latexInput = $(this);

	input.after(answerQuill);

	// Default options.
	var cfgOptions = {
		spaceBehavesLikeTab: true,
		leftRightIntoCmdGoes: 'up',
		restrictMismatchedBrackets: true,
		sumStartsWithNEquals: true,
		supSubsRequireOperand: true,
		autoCommands: 'pi sqrt root vert inf union abs',
		rootsAreExponents: true,
		maxDepth: 10
	};

	// Merge options that are set by the problem.
	var optOverrides = answerQuill.latexInput.data("mq-opts");
	if (typeof(optOverrides) == 'object') $.extend(cfgOptions, optOverrides);

	// This is after the option merge to prevent handlers from being overridden.
	cfgOptions.handlers = {
		edit: function(mq) {
			if (mq.text() !== "") {
				answerQuill.input.val(mq.text().trim());
				answerQuill.latexInput
					.val(mq.latex().replace(/^(?:\\\s)*(.*?)(?:\\\s)*$/, '$1'));
			} else {
				answerQuill.input.val('');
				answerQuill.latexInput.val('');
			}
		},
		// Disable the toolbar when a text block is entered.
		textBlockEnter: function() {
			if (answerQuill.toolbar)
				answerQuill.toolbar.find("button").prop("disabled", true);
		},
		// Re-enable the toolbar when a text block is exited.
		textBlockExit: function() {
			if (answerQuill.toolbar)
				answerQuill.toolbar.find("button").prop("disabled", false);
		}
	};

	answerQuill.mathField = MQ.MathField(answerQuill[0], cfgOptions);

	answerQuill.textarea = answerQuill.find("textarea");

	answerQuill.hasFocus = false;

	answerQuill.buttons = [
		{ id: 'frac', latex: '/', tooltip: 'fraction (/)', icon: '\\frac{\\text{\ \ }}{\\text{\ \ }}' },
		{ id: 'abs', latex: '|', tooltip: 'absolute value (|)', icon: '|\\text{\ \ }|' },
		{ id: 'sqrt', latex: '\\sqrt', tooltip: 'square root (sqrt)', icon: '\\sqrt{\\text{\ \ }}' },
		{ id: 'nthroot', latex: '\\root', tooltip: 'nth root (root)', icon: '\\sqrt[\\text{\ \ }]{\\text{\ \ }}' },
		{ id: 'exponent', latex: '^', tooltip: 'exponent (^)', icon: '\\text{\ \ }^\\text{\ \ }' },
		{ id: 'infty', latex: '\\infty', tooltip: 'infinity (inf)', icon: '\\infty' },
		{ id: 'pi', latex: '\\pi', tooltip: 'pi (pi)', icon: '\\pi' },
		{ id: 'vert', latex: '\\vert', tooltip: 'such that (vert)', icon: '|' },
		{ id: 'cup', latex: '\\cup', tooltip: 'union (union)', icon: '\\cup' },
		{ id: 'leq', latex: '\\leq', tooltip: 'less than or equal (<=)', icon: '\\leq' },
		{ id: 'geq', latex: '\\geq', tooltip: 'greater than or equal (>=)', icon: '\\geq' },
		{ id: 'text', latex: '\\text', tooltip: 'text mode (")', icon: 'Tt' },
		{ id: 'int', latex: '\\int', tooltip: 'integral (integral)', icon: '\\int' },
		{ id: 'sum', latex: '\\sum', tooltip: 'summation (sum)', icon: '\\sum' },
		{ id: 'times', latex: '\\times', tooltip: 'times (x)', icon: '\\times' },
		{ id: 'cdot', latex: '\\cdot', tooltip: 'dot (cdot)', icon: '\\cdot' },
		{ id: 'approx', latex: '\\approx', tooltip: 'approximately equal to (approx)', icon: '\\approx' },
		{ id: 'neq', latex: '\\neq', tooltip: 'not equal to (neq)', icon: '\\neq' },
		{ id: 'rightarrow', latex: '\\rightarrow', tooltip: 'right arrow (rightarrow)', icon: '\\rightarrow' },
		{ id: 'delta', latex: '\\delta', tooltip: 'delta (delta)', icon: '\\delta' },
		{ id: 'lambda', latex: '\\lambda', tooltip: 'lambda (lambda)', icon: '\\lambda' },
		{ id: 'theta', latex: '\\theta', tooltip: 'theta (theta)', icon: '\\theta' },
		{ id: 'sigma', latex: '\\sigma', tooltip: 'sigma (sigma)', icon: '\\sigma' },
		{ id: 'omega', latex: '\\omega', tooltip: 'omega (omega)', icon: '\\omega' },
		{ id: 'phi', latex: '\\phi', tooltip: 'phi (phi)', icon: '\\phi' },
		{ id: 'rho', latex: '\\rho', tooltip: 'rho (rho)', icon: '\\rho' },
		{ id: 'mu', latex: '\\mu', tooltip: 'mu (mu)', icon: '\\mu' }
	];

	// Open the toolbar when the mathquill answer box gains focus.
	answerQuill.textarea.on('focusin', function() {
		answerQuill.hasFocus = true;
		if (answerQuill.toolbar) return;
		answerQuill.toolbar = $("<div class='quill-toolbar'>" +
			answerQuill.buttons.reduce(
				function(returnString, curButton) {
					return returnString +
						"<button id='" + curButton.id + "-" + answerQuill.attr('id') +
						"' class='symbol-button btn' " +
						"' data-latex='" + curButton.latex +
						"' data-tooltip='" + curButton.tooltip + "'>" +
						"<span id='icon-" + curButton.id + "-" + answerQuill.attr('id') + "'>"
						+ curButton.icon +
						"</span>" +
						"</button>";
				}, ""
			) + "</div>");
		answerQuill.toolbar.appendTo(document.body);

		answerQuill.toolbar.find(".symbol-button").each(function() {
			MQ.StaticMath($("#icon-" + this.id)[0]);
		});

		$(".symbol-button").uitooltip( {
			items: "[data-tooltip]",
			position: {my: "right center", at: "left-5px center"},
			show: {delay: 500, effect: "none"},
			hide: {delay: 0, effect: "none"},
			content: function() {
				var element = $(this);
				if (element.prop("disabled")) return;
				if (element.is("[data-tooltip]")) { return element.attr("data-tooltip"); }
			}
		});

		$(".symbol-button").on("click", function() {
			answerQuill.hasFocus = true;
			answerQuill.mathField.cmd(this.getAttribute("data-latex"));
			answerQuill.textarea.focus();
		});
	});

	answerQuill.textarea.on('focusout', function() {
		answerQuill.hasFocus = false;
		setTimeout(function() {
			if (!answerQuill.hasFocus && answerQuill.toolbar)
			{
				answerQuill.toolbar.remove();
				delete answerQuill.toolbar;
			}
		}, 200);
	});

	// Trigger an answer preview when the enter key is pressed in an answer box.
	answerQuill.on('keypress.preview', function(e) {
		if (e.key == 'Enter' || e.which == 13 || e.keyCode == 13) {
			// For homework
			$("#previewAnswers_id").trigger('click');
			// For gateway quizzes
			$("input[name=previewAnswers]").trigger('click');
		}
	});

	answerQuill.mathField.latex(answerQuill.latexInput.val());
	answerQuill.mathField.moveToLeftEnd();
	answerQuill.mathField.blur();

	// Give the mathquill answer box the correct/incorrect colors.
	setTimeout(function() {
		if (answerQuill.input.hasClass('correct')) answerQuill.addClass('correct');
		else if (answerQuill.input.hasClass('incorrect')) answerQuill.addClass('incorrect');
	}, 300);

	// Replace the result table correct/incorrect javascript that gives focus
	// to the original input, with javascript that gives focus to the mathquill
	// answer box.
	var resultsTableRows = jQuery("table.attemptResults tr:not(:first-child)");
	if (resultsTableRows.length)
	{
		resultsTableRows.each(function()
			{
				var result = $(this).find("td > a");
				var href = result.attr('href');
				if (result.length && href !== undefined && href.indexOf(answerLabel) != -1)
				{
					// Set focus to the mathquill answer box if the correct/incorrect link is clicked.
					result.attr('href',
						"javascript:void(window.answerQuills['" + answerLabel + "'].textarea.focus())");
				}
			}
		);
	}

	answerQuills[answerLabel] = answerQuill;
});
